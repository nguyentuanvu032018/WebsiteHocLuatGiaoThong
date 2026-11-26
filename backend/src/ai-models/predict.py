import os
import sys
import json
import io
import base64

# Đảm bảo in UTF-8 trên Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

try:
    import torch
    import torch.nn as nn
    from torchvision import models, transforms
    from PIL import Image
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Thiếu thư viện Python: {str(e)}"
    }, ensure_ascii=False))
    sys.exit(1)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
CLASSES_JSON = os.path.join(CURRENT_DIR, "classes.json")
SIGN_INFO_JSON = os.path.join(CURRENT_DIR, "sign_info.json")
MODEL_PATH = os.path.join(CURRENT_DIR, "best_resnet50_traffic_signs.pth")

# 1. Đọc danh sách classes
class_names = []
if os.path.exists(CLASSES_JSON):
    with open(CLASSES_JSON, 'r', encoding='utf-8') as f:
        class_names = json.load(f).get("classes", [])

num_classes = len(class_names) if len(class_names) > 0 else 51

# 2. Đọc thông tin chi tiết biển báo (ý nghĩa, lời khuyên)
sign_info = {}
if os.path.exists(SIGN_INFO_JSON):
    with open(SIGN_INFO_JSON, 'r', encoding='utf-8') as f:
        sign_info = json.load(f)

# 3. Khởi tạo và load trọng số mô hình ResNet50
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = models.resnet50()
model.fc = nn.Linear(model.fc.in_features, num_classes)

if not os.path.exists(MODEL_PATH):
    print(json.dumps({
        "success": False,
        "error": f"Không tìm thấy file trọng số mô hình: {MODEL_PATH}"
    }, ensure_ascii=False))
    sys.exit(1)

try:
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model = model.to(device)
    model.eval()
except Exception as e:
    print(json.dumps({
        "success": False,
        "error": f"Lỗi nạp mô hình PyTorch: {str(e)}"
    }, ensure_ascii=False))
    sys.exit(1)

# 4. Tiền xử lý ảnh chuẩn ResNet50 ImageNet
resnet_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def predict_pil(img_pil):
    img_rgb = img_pil.convert('RGB')
    input_tensor = resnet_transforms(img_rgb).unsqueeze(0).to(device)
    
    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        topk_prob, topk_indices = torch.topk(probabilities, k=min(3, num_classes), dim=1)

    top_idx = topk_indices[0][0].item()
    top_conf = topk_prob[0][0].item() * 100
    top_cname = class_names[top_idx] if top_idx < len(class_names) else f"Biển báo #{top_idx}"

    topk_list = []
    for i in range(topk_indices.size(1)):
        idx = topk_indices[0][i].item()
        cname = class_names[idx] if idx < len(class_names) else f"Biển báo #{idx}"
        conf = topk_prob[0][i].item() * 100
        topk_list.append({
            "className": cname,
            "confidence": round(conf, 2)
        })

    info = sign_info.get(top_cname, {
        "meaning": "Thông tin chi tiết đang được cập nhật...",
        "advice": "Chú ý quan sát và tuân thủ quy tắc an toàn giao thông đường bộ."
    })

    return {
        "success": True,
        "className": top_cname,
        "confidence": round(top_conf, 2),
        "meaning": info.get("meaning", "Đang cập nhật..."),
        "advice": info.get("advice", "Đang cập nhật..."),
        "topPredictions": topk_list
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Thiếu tham số đường dẫn ảnh hoặc dữ liệu ảnh"}, ensure_ascii=False))
        sys.exit(1)

    input_arg = sys.argv[1]

    try:
        # Nếu là base64 data URI
        if input_arg.startswith("data:image"):
            base64_data = input_arg.split(",")[1]
            image_bytes = base64.b64decode(base64_data)
            img_pil = Image.open(io.BytesIO(image_bytes))
        # Nếu là file trên ổ đĩa
        elif os.path.exists(input_arg):
            img_pil = Image.open(input_arg)
        # Nếu là chuỗi base64 thuần
        else:
            try:
                image_bytes = base64.b64decode(input_arg)
                img_pil = Image.open(io.BytesIO(image_bytes))
            except Exception:
                print(json.dumps({"success": False, "error": "Đường dẫn file không tồn tại hoặc định dạng base64 không hợp lệ"}, ensure_ascii=False))
                sys.exit(1)

        result = predict_pil(img_pil)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Lỗi xử lý ảnh: {str(e)}"}, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()

