# ACSS Cloud Brain Setup Guide

Follow these steps to host your ACSS AI Brain on Google Colab (Free T4 GPU) and connect it to your local system.

## 1. Setup Google Colab
1.  Go to [Google Colab](https://colab.research.google.com/).
2.  Create a **New Notebook**.
3.  Change Runtime Type: **Runtime > Change runtime type > T4 GPU**.

## 2. Run the Boot Script
Run this single command in a Colab cell to automate everything (installs, server, and ngrok):

```python
# Upload colab_boot.py and run:
%run colab_boot.py
```
**OR** paste the entire content of `cloud/colab_boot.py` into a cell and run it.

## 3. Enter your ngrok Token
When prompted by the script, enter your **ngrok Authtoken**. Get it from [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken).

## 4. Local Configuration
Once the script prints your **Public URL**, copy it and run it on your local machine to connect instantly:

```bash
# Set URL and enable Cloud Mode in one command
acss brain https://your-id.ngrok-free.app

# Verify health
acss brain
```

## 5. Switching back to Local
If you want to stop using the Cloud Brain and go back to strictly local processing:

```bash
acss local
```
*This instantly disables cloud requests and routes everything to Ollama.*

# Verify connection
acss brain status
```

---
**Tip**: Using `brainMode cloud` ensures that strictly no local resources (besides network) are used for AI processing.
