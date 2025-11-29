# TouchDesigner Prompt API Setup Guide

## Architecture Overview

```
Web Server DAT → Callback DAT → Text DAT (incomingPrompt) → Text TOP
                                                              ↓
                                                         Field COMP (optional)
```

### Node Responsibilities

- **Web Server DAT**: Exposes HTTP API endpoints on a configurable port
- **Callback DAT**: Contains Python script that handles HTTP requests, validates input, and updates the Text DAT
- **Text DAT (incomingPrompt)**: Stores the current prompt text value
- **Text TOP**: Displays the text from the Text DAT, updates automatically when DAT changes
- **Field COMP** (optional): Provides UI for manual editing, bi-directionally bound to Text DAT

---

## Step-by-Step TouchDesigner Setup

### 1. Create the Text DAT

1. Press `Tab` → type `text` → select `Text DAT`
2. Rename it to `incomingPrompt`
3. Set the text to an initial value (e.g., "Default prompt")
4. This DAT will store the prompt text that gets updated via API

### 2. Create the Text TOP

1. Press `Tab` → type `text` → select `Text TOP`
2. Rename it to `promptDisplay`
3. In the **Text** parameter, enter: `op('incomingPrompt').text`
4. This creates a reference that automatically updates when the Text DAT changes

### 3. Create the Web Server DAT

1. Press `Tab` → type `web` → select `Web Server DAT`
2. Rename it to `promptServer`
3. Set **Port** to your desired port (e.g., `8080`)
4. Set **Active** to `1` (checked)
5. Set **Callbacks DAT** parameter to point to your Callback DAT (create this next)

**Port Selection:**
- Use a port between `8000-8999` to avoid conflicts
- Common choices: `8080`, `8081`, `8888`
- Check if port is in use: In Windows Command Prompt, run `netstat -an | findstr :8080`

**Network Access:**
- **localhost only**: Use `127.0.0.1` or `localhost` - only accessible from the same machine
- **LAN access**: Use `0.0.0.0` or your machine's local IP (e.g., `192.168.1.100`) - accessible from other devices on the network
- Set this in the Web Server DAT's **Bind** parameter (default is usually `0.0.0.0`)

**Security Considerations:**
- This is a simple API with no authentication - only use on trusted networks
- For production, consider adding basic auth or API keys
- Firewall rules may need adjustment to allow incoming connections

### 4. Create the Callback DAT

1. Press `Tab` → type `text` → select `Text DAT`
2. Rename it to `promptCallback`
3. Paste the Python code below into this DAT
4. Ensure the Web Server DAT's **Callbacks DAT** parameter points to `promptCallback`

### 5. (Optional) Create Field COMP for Manual Editing

1. Press `Tab` → type `field` → select `Field COMP`
2. Rename it to `promptField`
3. In the **Text** parameter, enter: `op('incomingPrompt').text`
4. In the **Callback** parameter, enter:
   ```python
   me.par.text = op('incomingPrompt').par.text
   ```
5. Add a callback script to the Field COMP:
   - Right-click → **Edit Script** → **Callback Script**
   - Enter:
   ```python
   def onValueChange(channel, sampleIndex, val, prev):
       op('incomingPrompt').text = val
   ```

---

## Python Callback Script

Paste this code into your `promptCallback` Text DAT:

```python
def onHTTPRequest(request, response):
    """
    Handle HTTP requests for prompt API endpoints.
    
    Routes:
    - POST /updatePrompt: Updates the prompt text
    - GET /currentPrompt: Returns the current prompt text
    """
    
    # Get the Text DAT that stores the prompt
    promptDAT = op('incomingPrompt')
    
    if promptDAT is None:
        response.statusCode = 500
        response.data = '{"error": "Prompt DAT not found"}'
        return
    
    # Parse the request path
    path = request.uri.path
    
    try:
        if request.method == 'POST' and path == '/updatePrompt':
            # Parse JSON body
            import json
            try:
                body = json.loads(request.data)
            except:
                response.statusCode = 400
                response.data = '{"error": "Invalid JSON"}'
                return
            
            # Validate input
            if 'text' not in body:
                response.statusCode = 400
                response.data = '{"error": "Missing \'text\' field"}'
                return
            
            text = str(body['text'])
            
            # Update the Text DAT
            promptDAT.text = text
            
            # Return success response
            response.statusCode = 200
            response.data = json.dumps({
                "success": True,
                "text": text,
                "message": "Prompt updated successfully"
            })
            response.headers['Content-Type'] = 'application/json'
            
        elif request.method == 'GET' and path == '/currentPrompt':
            # Read current prompt from Text DAT
            currentText = promptDAT.text
            
            # Return current prompt
            import json
            response.statusCode = 200
            response.data = json.dumps({
                "text": currentText
            })
            response.headers['Content-Type'] = 'application/json'
            
        else:
            # Unknown route or method
            response.statusCode = 404
            response.data = '{"error": "Not found"}'
            response.headers['Content-Type'] = 'application/json'
            
    except Exception as e:
        # Handle any errors
        import json
        response.statusCode = 500
        response.data = json.dumps({
            "error": "Internal server error",
            "message": str(e)
        })
        response.headers['Content-Type'] = 'application/json'
```

**Important Notes:**
- Replace `op('incomingPrompt')` with your actual Text DAT name if different
- The script uses TouchDesigner's `onHTTPRequest` callback signature
- JSON parsing and error handling are included
- Status codes follow HTTP standards (200, 400, 404, 500)

---

## External Web App HTTP Examples

### POST /updatePrompt

**Using curl:**
```bash
# Localhost (same machine)
curl -X POST http://localhost:8080/updatePrompt \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from external app!"}'

# LAN access (replace with TouchDesigner machine's IP)
curl -X POST http://192.168.1.100:8080/updatePrompt \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from external app!"}'
```

**Using JavaScript (fetch):**
```javascript
fetch('http://localhost:8080/updatePrompt', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ text: 'Hello from external app!' })
})
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

**Expected Response:**
```json
{
  "success": true,
  "text": "Hello from external app!",
  "message": "Prompt updated successfully"
}
```

### GET /currentPrompt

**Using curl:**
```bash
# Localhost
curl http://localhost:8080/currentPrompt

# LAN access
curl http://192.168.1.100:8080/currentPrompt
```

**Using JavaScript (fetch):**
```javascript
fetch('http://localhost:8080/currentPrompt')
  .then(response => response.json())
  .then(data => console.log('Current prompt:', data.text))
  .catch(error => console.error('Error:', error));
```

**Expected Response:**
```json
{
  "text": "Current prompt text value"
}
```

### Network Access Notes

- **localhost/127.0.0.1**: Only accessible from the machine running TouchDesigner
- **LAN IP (e.g., 192.168.1.100)**: Accessible from other devices on the same network
- **Finding your IP**: 
  - Windows: `ipconfig` in Command Prompt, look for IPv4 Address
  - Mac/Linux: `ifconfig` or `ip addr`, look for inet address
- **Firewall**: May need to allow incoming connections on the chosen port
- **CORS**: TouchDesigner Web Server DAT doesn't set CORS headers by default. If calling from a browser, you may need to add CORS headers in the callback script:
  ```python
  response.headers['Access-Control-Allow-Origin'] = '*'
  response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
  response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
  ```

---

## Testing the Setup

1. **Start TouchDesigner** and ensure the Web Server DAT is active (green indicator)
2. **Test POST endpoint**:
   ```bash
   curl -X POST http://localhost:8080/updatePrompt \
     -H "Content-Type: application/json" \
     -d '{"text": "Test prompt"}'
   ```
3. **Verify Text DAT updated**: Check `incomingPrompt` Text DAT - should show "Test prompt"
4. **Verify Text TOP updated**: Check `promptDisplay` Text TOP - should display "Test prompt"
5. **Test GET endpoint**:
   ```bash
   curl http://localhost:8080/currentPrompt
   ```
6. **Should return**: `{"text": "Test prompt"}`

---

## Troubleshooting

- **Web Server not starting**: Check port conflicts, try a different port
- **404 errors**: Verify the path is exactly `/updatePrompt` or `/currentPrompt` (case-sensitive)
- **500 errors**: Check that `incomingPrompt` Text DAT exists and is named correctly
- **Connection refused**: Verify Web Server DAT is active, check firewall settings
- **Text TOP not updating**: Ensure the Text parameter expression is `op('incomingPrompt').text`
- **Field COMP not syncing**: Verify callback scripts are set up correctly

---

## Summary

This setup provides a simple HTTP API that allows external applications to:
- Update prompt text via POST requests
- Read current prompt text via GET requests
- Display the prompt in TouchDesigner via Text TOP
- Optionally edit manually via Field COMP

The API is lightweight, requires no external dependencies, and integrates seamlessly with TouchDesigner's existing node system.

