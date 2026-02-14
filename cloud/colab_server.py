
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import os

app = FastAPI(title="ACSS Cloud Brain")

# Model configuration
MODEL_ID = os.getenv("ACSS_MODEL", "meta-llama/Llama-3.2-1B-Instruct") # Lightweight for T4
device = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Loading model {MODEL_ID} on {device}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.bfloat16 if device == "cuda" else torch.float32,
    device_map="auto" if device == "cuda" else None
)

class GenerateRequest(BaseModel):
    prompt: str
    system_prompt: str = "You are a helpful coding assistant."
    max_tokens: int = 512
    temperature: float = 0.7

@app.post("/generate")
async def generate(request: GenerateRequest):
    try:
        messages = [
            {"role": "system", "content": request.system_prompt},
            {"role": "user", "content": request.prompt}
        ]
        
        input_ids = tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            return_tensors="pt"
        ).to(device)

        with torch.no_grad():
            outputs = model.generate(
                input_ids,
                max_new_tokens=request.max_tokens,
                do_sample=True,
                temperature=request.temperature,
                pad_token_id=tokenizer.eos_token_id
            )

        response = tokenizer.decode(outputs[0][input_ids.shape[-1]:], skip_special_tokens=True)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/compress")
async def compress(request: GenerateRequest):
    # Specialized compression settings
    request.system_prompt = "You are an ACSS session compressor. Summarize this JSON into a smaller but valid ACSS JSON. Output ONLY JSON."
    request.max_tokens = max(request.max_tokens, 1024) # Ensure enough space for large sessions
    return await generate(request)

@app.get("/health")
async def health():
    return {"status": "ok", "device": device, "model": MODEL_ID}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
