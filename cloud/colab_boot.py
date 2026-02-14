# ACSS CLOUD BRAIN v6.0 - Agentic Infrastructure
# Optimized for Deep Context Extraction & Session Fusion
# Copy this entire cell into Google Colab and run.

#===============================================
# STEP 1: Install Dependencies
#===============================================
print("📦 Installing dependencies...")
import os
os.system("pip install -q fastapi uvicorn pydantic transformers torch accelerate bitsandbytes pyngrok nest-asyncio fs-extra")

#===============================================
# STEP 2: Configure Ngrok
#===============================================
NGROK_TOKEN = "31yYPXhPRNGBB9mEcNpDp8YOaZK_65SMKRBe8C7UUe1V2wfMx"

import nest_asyncio
from pyngrok import ngrok, conf

nest_asyncio.apply()

print("🔐 Authenticating with ngrok...")
if NGROK_TOKEN:
    conf.get_default().auth_token = NGROK_TOKEN
else:
    print("⚠️ No Ngrok token found. Please set one.")

ngrok.kill()

#===============================================
# STEP 3: Load Model (Qwen-1.5B - High Stability Fallback)
#===============================================
print("🧠 Loading ACSS Intelligence (this takes 1-2 minutes)...")

from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import json
import time
import uuid
import io
import sys
from typing import Dict, Any, List, Optional

model_id = "Qwen/Qwen2.5-Coder-1.5B-Instruct" # Extremely stable and fast

try:
    print(f"⏳ Loading {model_id}...", flush=True)
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_id, 
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto", 
        trust_remote_code=True
    )
    print(f"✅ Model loaded: {model_id}", flush=True)
except Exception as e:
    print(f"❌ Model failed to load: {e}", flush=True)
    raise e

def extract_json_from_text(text: str) -> Dict:
    """Robust JSON extractor for fragile LLM outputs."""
    try:
        content = text.strip()
        if "```json" in content: content = content.split("```json")[1]
        elif "```" in content: content = content.split("```")[1]
        if "```" in content: content = content.split("```")[0]

        start = content.find("{")
        end = content.rfind("}") + 1
        if start != -1 and end > start:
            content = content[start:end]
            return json.loads(content)
        return {}
    except:
        return {}

#===============================================
# STEP 4: FastAPI Server
#===============================================
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="ACSS Agentic Brain", version="6.1")

class GenerateRequest(BaseModel):
    prompt: str
    system_prompt: str = "You are a helpful software architect."
    max_tokens: int = 1500
    temperature: float = 0.2
    json_mode: bool = False

@app.get("/health")
async def health():
    return {
        "status": "online",
        "model": model_id,
        "device": str(model.device),
        "version": "6.1"
    }

@app.post("/generate")
async def generate(request: GenerateRequest):
    """ACSS Core Inference Engine."""
    print(f"📥 Received Task: {len(request.prompt)} chars", flush=True)
    start_time = time.time()
    try:
        messages = [
            {"role": "system", "content": request.system_prompt},
            {"role": "user", "content": request.prompt}
        ]
        
        print("   ... applying chat template", flush=True)
        inputs = tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            return_tensors="pt",
            return_dict=True
        ).to(model.device)

        print(f"   ... generating (input shape: {inputs.input_ids.shape})", flush=True)
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=request.max_tokens,
                temperature=request.temperature,
                do_sample=True if request.temperature > 0 else False,
                pad_token_id=tokenizer.eos_token_id
            )

        print("   ... decoding response", flush=True)
        response_text = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
        
        result = response_text
        if request.json_mode or "Must output valid JSON" in request.system_prompt:
             parsed = extract_json_from_text(response_text)
             if parsed: result = json.dumps(parsed)

        print(f"✅ Generated in {time.time() - start_time:.2f}s", flush=True)
        return {"response": result}
    except Exception as e:
        import traceback
        err = traceback.format_exc()
        print(f"❌ Error during generation:\n{err}", flush=True)
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}\n{err}")

#===============================================
# STEP 5: Run Server
#===============================================
print("🚀 Starting ACSS Agentic Brain v6.1...", flush=True)
public_url = ngrok.connect(8000).public_url

print("\n" + "="*60)
print(f"✅ ACSS CLOUD BRAIN ACTIVE")
print(f"🔗 Public URL: {public_url}")
print("="*60)
print("\n👉 Run locally to connect:")
print(f"   acss brain {public_url}")
print("\n⚠️ IMPORTANT: Keep this Colab cell running!")

import uvicorn
import asyncio
config = uvicorn.Config(app, host="0.0.0.0", port=8000, log_level="info")
server = uvicorn.Server(config)
asyncio.get_event_loop().run_until_complete(server.serve())
