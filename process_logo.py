from PIL import Image

def create_transparent_logo():
    img = Image.open(r"C:\Users\enriq\.gemini\antigravity-ide\brain\55bcbc9b-f351-40b9-984b-9d4a980847ff\terratrust_icon_1789234694424.jpg")
    img = img.convert("RGB")
    
    gray = img.convert("L")
    
    def curve(p):
        if p < 40: return 0
        if p > 120: return 255
        return int((p - 40) * (255 / 80))
        
    mask = gray.point(curve)
    
    img.putalpha(mask)
    img.save(r"c:\Users\enriq\Downloads\app\public\icon_transparent.png", "PNG")

create_transparent_logo()
