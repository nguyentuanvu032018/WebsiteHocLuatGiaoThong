const { pool } = require('../../src/config/db.config');

/**
 * ==============================================================================
 * BỘ SEED DỮ LIỆU HỆ THỐNG BIỂN BÁO GIAO THÔNG ĐƯỜNG BỘ & TRA CỨU MỨC PHẠT
 * Căn cứ:
 * - Quy chuẩn kỹ thuật quốc gia về báo hiệu đường bộ QCVN 41:2019/BGTVT
 * - Nghị định 100/2019/NĐ-CP & Nghị định 123/2021/NĐ-CP của Chính phủ
 * ==============================================================================
 */

// 1. Danh sách Biển báo giao thông
// category_id: 1: CAM, 2: NGUY_HIEM, 3: HIEU_LENH, 4: CHI_DAN, 5: PHU
const trafficSignsData = [
  // ---------------------------------------------------------------------------
  // NHÓM 1: BIỂN BÁO CẤM (category_id = 1)
  // ---------------------------------------------------------------------------
  {
    categoryId: 1,
    signCode: 'P.101',
    name: 'Đường cấm',
    description: 'Báo đường cấm tất cả các loại phương tiện (cơ giới và thô sơ) đi lại theo cả hai hướng, trừ các xe được ưu tiên theo quy định.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-p101_2409095648.png'
  },
  {
    categoryId: 1,
    signCode: 'P.102',
    name: 'Cấm đi ngược chiều',
    description: 'Báo đường cấm tất cả các loại xe (cơ giới và thô sơ) đi vào theo chiều đặt biển, trừ các xe được ưu tiên theo quy định.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-p102_2409095649.png'
  },
  {
    categoryId: 1,
    signCode: 'P.103a',
    name: 'Cấm xe ô tô',
    description: 'Báo đường cấm tất cả các loại xe cơ giới kể cả xe ba bánh có thùng đi qua, trừ xe mô tô hai bánh, xe gắn máy và các xe được ưu tiên theo quy định.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-p103a_2409095650.png'
  },
  {
    categoryId: 1,
    signCode: 'P.104',
    name: 'Cấm xe mô tô',
    description: 'Báo đường cấm tất cả các loại mô tô đi qua, trừ các loại xe mô tô được ưu tiên theo quy định. Biển không có giá trị cấm xe gắn máy.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-p104_2409095652.png'
  },
  {
    categoryId: 1,
    signCode: 'P.105',
    name: 'Cấm xe ô tô và xe mô tô',
    description: 'Báo đường cấm tất cả các loại xe cơ giới và xe mô tô đi qua trừ xe gắn máy và các xe được ưu tiên theo quy định.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-p105_2409095653.png'
  },
  {
    categoryId: 1,
    signCode: 'P.106a',
    name: 'Cấm xe ô tô tải',
    description: 'Báo đường cấm tất cả các loại ô tô tải trừ các xe ưu tiên. Biển có hiệu lực cấm đối với cả máy kéo và xe máy chuyên dùng.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-p106a_2409095654.png'
  },
  {
    categoryId: 1,
    signCode: 'P.112',
    name: 'Cấm người đi bộ',
    description: 'Báo đường cấm người đi bộ qua lại trên đoạn đường có đặt biển.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-p112_2409095659.png'
  },
  {
    categoryId: 1,
    signCode: 'P.115',
    name: 'Hạn chế trọng tải toàn bộ xe',
    description: 'Báo đường cấm các loại xe (cơ giới và thô sơ) kể cả các xe được ưu tiên có trọng lượng toàn bộ (xe cộng hàng) vượt quá trị số ghi trên biển.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-p115_2409095701.png'
  },
  {
    categoryId: 1,
    signCode: 'P.123a',
    name: 'Cấm rẽ trái',
    description: 'Báo cấm rẽ trái tại vị trí đặt biển. Theo QCVN 41:2019/BGTVT, biển cấm rẽ trái không còn đồng thời cấm quay đầu xe.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-p123a_2409095708.png'
  },
  {
    categoryId: 1,
    signCode: 'P.124a',
    name: 'Cấm quay đầu xe',
    description: 'Báo cấm các loại xe quay đầu (theo kiểu chữ U). Biển này không cấm xe rẽ trái để sang đường.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-p124a_2409095709.png'
  },
  {
    categoryId: 1,
    signCode: 'P.125',
    name: 'Cấm vượt',
    description: 'Báo cấm các loại xe cơ giới vượt nhau trên đoạn đường này. Biển hết hiệu lực khi gặp biển DP.133 "Hết cấm vượt" hoặc biển DP.135.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-p125_2409095711.png'
  },
  {
    categoryId: 1,
    signCode: 'P.127',
    name: 'Tốc độ tối đa cho phép',
    description: 'Báo tốc độ tối đa cho phép các xe cơ giới chạy trên đoạn đường này (tính bằng km/h ghi trong biển, ví dụ 50).',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-p127_2409095713.png'
  },
  {
    categoryId: 1,
    signCode: 'P.130',
    name: 'Cấm dừng xe và đỗ xe',
    description: 'Báo nơi cấm tất cả các loại phương tiện dừng xe và đỗ xe ở đoạn đường có đặt biển.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-p130_2409095715.png'
  },
  {
    categoryId: 1,
    signCode: 'P.131a',
    name: 'Cấm đỗ xe',
    description: 'Báo nơi cấm tất cả các loại phương tiện giao thông đỗ xe ở đoạn đường có đặt biển (vẫn được phép dừng xe tạm thời đón trả khách).',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-p131a_2409095716.png'
  },

  // ---------------------------------------------------------------------------
  // NHÓM 2: BIỂN BÁO NGUY HIỂM VÀ CẢNH BÁO (category_id = 2)
  // ---------------------------------------------------------------------------
  {
    categoryId: 2,
    signCode: 'W.201a',
    name: 'Chỗ ngoặt nguy hiểm vòng bên trái',
    description: 'Báo trước sắp đến một chỗ ngoặt nguy hiểm vòng sang phía bên trái.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-w201a_2409095726.png'
  },
  {
    categoryId: 2,
    signCode: 'W.201b',
    name: 'Chỗ ngoặt nguy hiểm vòng bên phải',
    description: 'Báo trước sắp đến một chỗ ngoặt nguy hiểm vòng sang phía bên phải.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-w201b_2409095727.png'
  },
  {
    categoryId: 2,
    signCode: 'W.203b',
    name: 'Đường bị hẹp về phía bên phải',
    description: 'Báo trước đoạn đường phía trước bị hẹp đột ngột ở phần đường xe chạy bên phải.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-w203b_2409095730.png'
  },
  {
    categoryId: 2,
    signCode: 'W.205a',
    name: 'Đường giao nhau cùng mức',
    description: 'Báo trước sắp đến nơi giao nhau cùng mức của các tuyến đường cùng cấp (ngã tư). Lái xe phải chú ý quan sát và nhường đường bên phải.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-w205a_2409095732.png'
  },
  {
    categoryId: 2,
    signCode: 'W.207a',
    name: 'Giao nhau với đường không ưu tiên',
    description: 'Báo trước sắp đến nơi giao nhau với đường không ưu tiên. Xe đi trên đoạn đường có cắm biển này được quyền ưu tiên đi trước.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-w207a_2409095734.png'
  },
  {
    categoryId: 2,
    signCode: 'W.208',
    name: 'Giao nhau với đường ưu tiên',
    description: 'Báo trước sắp đến nơi giao nhau với đường ưu tiên. Xe đi trên tuyến đường này phải giảm tốc độ và nhường đường cho xe trên đường ưu tiên.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-w208_2409095737.png'
  },
  {
    categoryId: 2,
    signCode: 'W.209',
    name: 'Giao nhau có tín hiệu đèn',
    description: 'Báo trước nơi giao nhau có đèn tín hiệu điều khiển giao thông.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-w209_2409095738.png'
  },
  {
    categoryId: 2,
    signCode: 'W.210',
    name: 'Giao nhau với đường sắt có rào chắn',
    description: 'Báo trước sắp đến chỗ giao nhau giữa đường bộ và đường sắt có rào chắn đóng mở khi tàu hỏa chạy qua.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-w210_2409095739.png'
  },
  {
    categoryId: 2,
    signCode: 'W.211a',
    name: 'Giao nhau với đường sắt không có rào chắn',
    description: 'Báo trước sắp đến vị trí giao nhau giữa đường bộ và đường sắt không có rào chắn, không có người gác.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-w211a_2409095740.png'
  },
  {
    categoryId: 2,
    signCode: 'W.224',
    name: 'Đường người đi bộ cắt ngang',
    description: 'Báo trước sắp đến vị trí có bố trí vạch kẻ đường dành cho người đi bộ qua đường. Lái xe phải giảm tốc độ và chú ý quan sát.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-w224_2409095745.png'
  },
  {
    categoryId: 2,
    signCode: 'W.225',
    name: 'Trẻ em',
    description: 'Báo trước gần đến đoạn đường thường có trẻ em đi lại, tụ tập ven đường như trường học, công viên, sân chơi.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-w225_2409095746.png'
  },
  {
    categoryId: 2,
    signCode: 'W.227',
    name: 'Công trường',
    description: 'Báo trước gần đến đoạn đường đang có công trường thi công nâng cấp sửa chữa, có máy móc công nhân hoạt động.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-w227_2409095748.png'
  },
  {
    categoryId: 2,
    signCode: 'W.245a',
    name: 'Đi chậm',
    description: 'Nhắc nhở người lái xe phải giảm tốc độ để đảm bảo an toàn tuyệt đối.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-w245a_2409095750.png'
  },

  // ---------------------------------------------------------------------------
  // NHÓM 3: BIỂN HIỆU LỆNH (category_id = 3)
  // ---------------------------------------------------------------------------
  {
    categoryId: 3,
    signCode: 'R.301a',
    name: 'Các xe chỉ được đi thẳng',
    description: 'Bắt buộc các loại xe chỉ được đi thẳng ở nơi đường bộ giao nhau.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-r301a_2409095752.png'
  },
  {
    categoryId: 3,
    signCode: 'R.301d',
    name: 'Các xe chỉ được rẽ phải',
    description: 'Bắt buộc các loại xe chỉ được phép rẽ phải ở ngã ba hoặc ngã tư tiếp theo.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-r301d_2409095755.png'
  },
  {
    categoryId: 3,
    signCode: 'R.301e',
    name: 'Các xe chỉ được rẽ trái',
    description: 'Bắt buộc các loại xe chỉ được phép rẽ trái ở ngã ba hoặc ngã tư tiếp theo.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-r301e_2409095756.png'
  },
  {
    categoryId: 3,
    signCode: 'R.302a',
    name: 'Hướng phải đi vòng chướng ngại vật',
    description: 'Báo hiệu hướng đi bắt buộc các xe phải đi vòng sang phía bên phải để tránh chướng ngại vật.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-r302a_2409095757.png'
  },
  {
    categoryId: 3,
    signCode: 'R.303',
    name: 'Nơi giao nhau chạy theo vòng xuyến',
    description: 'Báo các xe phải chạy vòng quanh đảo giao thông (vòng xuyến) theo chiều mũi tên. Khi vào vòng xuyến phải nhường đường cho xe bên trái.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-r303_2409095758.png'
  },
  {
    categoryId: 3,
    signCode: 'R.304',
    name: 'Đường dành cho người đi bộ',
    description: 'Báo đường chỉ dành riêng cho người đi bộ lưu thông. Cấm các loại xe cơ giới và thô sơ đi vào.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-r304_2409095759.png'
  },
  {
    categoryId: 3,
    signCode: 'R.305',
    name: 'Đường dành cho xe thô sơ',
    description: 'Báo tuyến đường dành riêng cho xe đạp và người đi bộ đi lại.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-r305_2409095800.png'
  },
  {
    categoryId: 3,
    signCode: 'R.403a',
    name: 'Đường dành cho ô tô',
    description: 'Báo hiệu bắt đầu đoạn đường chỉ dành riêng cho các loại xe ô tô lưu thông.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-r403a_2409095802.png'
  },
  {
    categoryId: 3,
    signCode: 'R.420',
    name: 'Bắt đầu khu đông dân cư',
    description: 'Báo hiệu bắt đầu vào phạm vi khu đông dân cư. Người lái xe phải tuân thủ nghiêm ngặt tốc độ tối đa cho phép trong khu vực đông dân cư.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-r420_2409095806.png'
  },
  {
    categoryId: 3,
    signCode: 'R.421',
    name: 'Hết khu đông dân cư',
    description: 'Báo hiệu đã hết phạm vi khu đông dân cư, các phương tiện được phép áp dụng tốc độ tối đa ngoài khu đông dân cư.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-r421_2409095807.png'
  },

  // ---------------------------------------------------------------------------
  // NHÓM 4: BIỂN CHỈ DẪN (category_id = 4)
  // ---------------------------------------------------------------------------
  {
    categoryId: 4,
    signCode: 'I.401',
    name: 'Bắt đầu đường ưu tiên',
    description: 'Chỉ dẫn cho người tham gia giao thông biết bắt đầu đoạn đường ưu tiên. Xe đi trên đoạn này được quyền đi trước qua nơi giao nhau.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-i401_2409095810.png'
  },
  {
    categoryId: 4,
    signCode: 'I.402',
    name: 'Hết đoạn đường ưu tiên',
    description: 'Chỉ dẫn cho người tham gia giao thông biết đã hết đoạn đường được quyền ưu tiên.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-i402_2409095811.png'
  },
  {
    categoryId: 4,
    signCode: 'I.407a',
    name: 'Đường một chiều',
    description: 'Chỉ dẫn bắt đầu đoạn đường chỉ cho phép phương tiện giao thông đi một chiều theo hướng mũi tên chỉ.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-i407a_2409095814.png'
  },
  {
    categoryId: 4,
    signCode: 'I.409',
    name: 'Chỗ quay xe',
    description: 'Chỉ dẫn vị trí được phép quay đầu xe ô tô và mô tô theo hình chữ U.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-i409_2409095816.png'
  },
  {
    categoryId: 4,
    signCode: 'I.423a',
    name: 'Vị trí người đi bộ sang ngang',
    description: 'Chỉ dẫn cho người đi bộ và người lái xe biết nơi dành cho người đi bộ sang đường an toàn.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-i423a_2409095819.png'
  },
  {
    categoryId: 4,
    signCode: 'I.424a',
    name: 'Cầu vượt qua đường cho người đi bộ',
    description: 'Chỉ dẫn cho người đi bộ sử dụng cầu vượt để sang đường an toàn.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-i424a_2409095820.png'
  },
  {
    categoryId: 4,
    signCode: 'I.424b',
    name: 'Hầm chui qua đường cho người đi bộ',
    description: 'Chỉ dẫn cho người đi bộ sử dụng hầm ngầm để qua đường tránh xung đột với xe cơ giới.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-i424b_2409095821.png'
  },
  {
    categoryId: 4,
    signCode: 'I.434a',
    name: 'Bến xe buýt',
    description: 'Chỉ dẫn vị trí đón trả khách của xe buýt tuyến cố định.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-i434a_2409095824.png'
  },
  {
    categoryId: 4,
    signCode: 'I.443',
    name: 'Xe kéo rơ-moóc',
    description: 'Chỉ dẫn làn đường hoặc vị trí dành riêng cho các xe cơ giới có kéo theo rơ-moóc hoặc sơ-mi rơ-moóc.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-i443_2409095827.png'
  },

  // ---------------------------------------------------------------------------
  // NHÓM 5: BIỂN PHỤ (category_id = 5)
  // ---------------------------------------------------------------------------
  {
    categoryId: 5,
    signCode: 'S.501',
    name: 'Phạm vi tác dụng của biển',
    description: 'Đặt dưới các biển cấm, biển nguy hiểm để thông báo chiều dài đoạn đường nguy hiểm hoặc cấm áp dụng (ví dụ: 500m).',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-s501_2409095830.png'
  },
  {
    categoryId: 5,
    signCode: 'S.502',
    name: 'Khoảng cách đến đối tượng báo hiệu',
    description: 'Đặt bên dưới các biển báo chính để thông báo khoảng cách từ vị trí đặt biển tới vị trí bắt đầu có hiệu lực của biển chính (ví dụ: 200m).',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-s502_2409095831.png'
  },
  {
    categoryId: 5,
    signCode: 'S.503a',
    name: 'Hướng tác dụng của biển',
    description: 'Chỉ hướng tác dụng rẽ trái hoặc rẽ phải của biển cấm, biển hiệu lệnh tại các ngã đường.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-s503a_2409095832.png'
  },
  {
    categoryId: 5,
    signCode: 'S.504',
    name: 'Làn đường',
    description: 'Đặt bên dưới biển báo chính để chỉ rõ biển báo đó chỉ áp dụng hiệu lực cho một làn đường cụ thể.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-s504_2409095834.png'
  },
  {
    categoryId: 5,
    signCode: 'S.505a',
    name: 'Loại xe',
    description: 'Chỉ rõ loại xe chịu tác dụng của biển báo chính (xe con, xe tải, xe buýt...).',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-s505a_2409095835.png'
  },
  {
    categoryId: 5,
    signCode: 'S.506a',
    name: 'Hướng đường ưu tiên',
    description: 'Đặt dưới biển chỉ dẫn I.401 trên đường ưu tiên để chỉ dẫn hướng đường ưu tiên qua ngã ba ngã tư phức tạp.',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-s506a_2409095836.png'
  },
  {
    categoryId: 5,
    signCode: 'S.508a',
    name: 'Thời gian tác dụng',
    description: 'Chỉ rõ khoảng thời gian biển báo chính có hiệu lực trong ngày (ví dụ: 06:00 - 22:00).',
    imageUrl: 'https://cdn.luatvietnam.vn/uploaded/Images/Original/2020/09/24/bien-bao-s508a_2409095837.png'
  }
];

// 2. Danh mục Mức xử phạt theo Nghị định 100/2019/NĐ-CP & 123/2021/NĐ-CP
// fine_category_id: 1: XE_MAY, 2: OTO, 3: KHAC
const trafficFinesData = [
  // ===========================================================================
  // NHÓM 1: XE MÔ TÔ, XE GẮN MÁY (fine_category_id = 1)
  // ===========================================================================
  {
    fineCategoryId: 1,
    violationTitle: 'Nồng độ cồn chưa vượt quá 50 mg/100 ml máu (hoặc 0.25 mg/1 lít khí thở)',
    violationDetail: 'Điều khiển xe mô tô, xe gắn máy trên đường mà trong máu hoặc hơi thở có nồng độ cồn nhưng chưa vượt quá 50 miligam/100 mililít máu hoặc chưa vượt quá 0,25 miligam/1 lít khí thở.',
    minFineAmount: 2000000,
    maxFineAmount: 3000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 10 tháng đến 12 tháng.',
    legalReference: 'Điểm c Khoản 6 Điều 6 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 1,
    violationTitle: 'Nồng độ cồn vượt quá 50 mg đến 80 mg/100 ml máu (hoặc 0.25 đến 0.4 mg/1 lít khí thở)',
    violationDetail: 'Điều khiển xe mô tô, xe gắn máy trên đường mà trong máu hoặc hơi thở có nồng độ cồn vượt quá 50 miligam đến 80 miligam/100 mililít máu hoặc vượt quá 0,25 miligam đến 0,4 miligam/1 lít khí thở.',
    minFineAmount: 4000000,
    maxFineAmount: 5000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 16 tháng đến 18 tháng.',
    legalReference: 'Điểm c Khoản 7 Điều 6 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 1,
    violationTitle: 'Nồng độ cồn kịch khung (vượt quá 80 mg/100 ml máu hoặc vượt quá 0.4 mg/1 lít khí thở)',
    violationDetail: 'Điều khiển xe trên đường mà trong máu hoặc hơi thở có nồng độ cồn vượt quá 80 miligam/100 mililít máu hoặc vượt quá 0,4 miligam/1 lít khí thở hoặc không chấp hành yêu cầu kiểm tra nồng độ cồn.',
    minFineAmount: 6000000,
    maxFineAmount: 8000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 22 tháng đến 24 tháng.',
    legalReference: 'Điểm e Khoản 8 Điều 6 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 1,
    violationTitle: 'Chạy quá tốc độ quy định từ 05 km/h đến dưới 10 km/h',
    violationDetail: 'Điều khiển xe chạy quá tốc độ quy định từ 05 km/h đến dưới 10 km/h.',
    minFineAmount: 300000,
    maxFineAmount: 400000,
    penaltyAddition: 'Không áp dụng hình phạt bổ sung.',
    legalReference: 'Điểm c Khoản 2 Điều 6 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },
  {
    fineCategoryId: 1,
    violationTitle: 'Chạy quá tốc độ quy định từ 10 km/h đến 20 km/h',
    violationDetail: 'Điều khiển xe chạy quá tốc độ quy định từ 10 km/h đến 20 km/h.',
    minFineAmount: 800000,
    maxFineAmount: 1000000,
    penaltyAddition: 'Không áp dụng hình phạt bổ sung (trừ khi gây tai nạn giao thông sẽ bị tước GPLX từ 02 đến 04 tháng).',
    legalReference: 'Điểm a Khoản 4 Điều 6 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },
  {
    fineCategoryId: 1,
    violationTitle: 'Chạy quá tốc độ quy định trên 20 km/h',
    violationDetail: 'Điều khiển xe chạy quá tốc độ quy định trên 20 km/h.',
    minFineAmount: 4000000,
    maxFineAmount: 5000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 02 tháng đến 04 tháng.',
    legalReference: 'Điểm a Khoản 7 Điều 6 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 1,
    violationTitle: 'Không chấp hành hiệu lệnh của đèn tín hiệu giao thông (Vượt đèn đỏ, đèn vàng)',
    violationDetail: 'Không chấp hành hiệu lệnh của đèn tín hiệu giao thông khi điều khiển mô tô, xe gắn máy.',
    minFineAmount: 800000,
    maxFineAmount: 1000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 01 tháng đến 03 tháng.',
    legalReference: 'Điểm e Khoản 4 Điều 6 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },
  {
    fineCategoryId: 1,
    violationTitle: 'Đi ngược chiều của đường một chiều, đi ngược chiều trên đường có biển cấm',
    violationDetail: 'Đi ngược chiều của đường một chiều, đi ngược chiều trên đường có biển “Cấm đi ngược chiều”, trừ trường hợp xe ưu tiên đang đi làm nhiệm vụ khẩn cấp.',
    minFineAmount: 1000000,
    maxFineAmount: 2000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 01 tháng đến 03 tháng.',
    legalReference: 'Điểm a Khoản 5 Điều 6 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },
  {
    fineCategoryId: 1,
    violationTitle: 'Không đội mũ bảo hiểm hoặc cài quai không đúng quy cách',
    violationDetail: 'Không đội “mũ bảo hiểm cho người đi mô tô, xe máy” hoặc đội “mũ bảo hiểm cho người đi mô tô, xe máy” không cài quai đúng quy cách khi tham gia giao thông.',
    minFineAmount: 400000,
    maxFineAmount: 600000,
    penaltyAddition: 'Không áp dụng hình phạt bổ sung.',
    legalReference: 'Điểm b Khoản 4 Điều 2 Nghị định 123/2021/NĐ-CP'
  },
  {
    fineCategoryId: 1,
    violationTitle: 'Sử dụng điện thoại di động, thiết bị âm thanh khi đang lái xe',
    violationDetail: 'Người đang điều khiển xe sử dụng ô (dù), điện thoại di động, thiết bị âm thanh (trừ thiết bị trợ thính).',
    minFineAmount: 800000,
    maxFineAmount: 1000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 01 tháng đến 03 tháng.',
    legalReference: 'Điểm h Khoản 4 Điều 6 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },
  {
    fineCategoryId: 1,
    violationTitle: 'Điều khiển xe mô tô đi vào đường cao tốc',
    violationDetail: 'Điều khiển xe mô tô, xe gắn máy đi vào đường cao tốc, trừ xe phục vụ việc quản lý, bảo trì đường cao tốc.',
    minFineAmount: 2000000,
    maxFineAmount: 3000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 03 tháng đến 05 tháng; tạm giữ xe đến 07 ngày.',
    legalReference: 'Điểm b Khoản 6 Điều 6 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 1,
    violationTitle: 'Không có Giấy phép lái xe hoặc sử dụng GPLX không do cơ quan thẩm quyền cấp',
    violationDetail: 'Người điều khiển xe mô tô hai bánh có dung tích xi lanh dưới 175 cm3 và các loại xe tương tự mà không có Giấy phép lái xe hoặc sử dụng Giấy phép lái xe không hợp lệ.',
    minFineAmount: 1000000,
    maxFineAmount: 2000000,
    penaltyAddition: 'Tịch thu Giấy phép lái xe không hợp lệ, tạm giữ phương tiện đến 07 ngày.',
    legalReference: 'Điểm a Khoản 5 Điều 21 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },
  {
    fineCategoryId: 1,
    violationTitle: 'Điều khiển xe chạy trên vỉa hè (hè phố)',
    violationDetail: 'Điều khiển xe đi trên vỉa hè (hè phố), trừ trường hợp điều khiển xe đi qua hè phố để vào nhà.',
    minFineAmount: 400000,
    maxFineAmount: 600000,
    penaltyAddition: 'Không áp dụng hình phạt bổ sung.',
    legalReference: 'Điểm g Khoản 3 Điều 6 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 1,
    violationTitle: 'Chở quá số người quy định (chở từ 03 người trở lên trên xe)',
    violationDetail: 'Chở theo từ 03 người trở lên trên xe mô tô, xe gắn máy (trừ trường hợp chở người bệnh đi cấp cứu, trẻ em dưới 14 tuổi, áp giải tội phạm).',
    minFineAmount: 400000,
    maxFineAmount: 600000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 01 tháng đến 03 tháng (nếu chở từ 03 người trở lên).',
    legalReference: 'Điểm b Khoản 3 Điều 6 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 1,
    violationTitle: 'Không sử dụng đèn chiếu sáng trong thời gian từ 19 giờ hôm trước đến 05 giờ hôm sau',
    violationDetail: 'Không sử dụng đèn chiếu sáng trong thời gian từ 19 giờ hôm trước đến 05 giờ hôm sau hoặc khi sương mù, thời tiết xấu hạn chế tầm nhìn.',
    minFineAmount: 100000,
    maxFineAmount: 200000,
    penaltyAddition: 'Không áp dụng hình phạt bổ sung.',
    legalReference: 'Điểm l Khoản 1 Điều 6 Nghị định 100/2019/NĐ-CP'
  },

  // ===========================================================================
  // NHÓM 2: XE Ô TÔ VÀ CÁC PHƯƠNG TIỆN TƯƠNG TỰ (fine_category_id = 2)
  // ===========================================================================
  {
    fineCategoryId: 2,
    violationTitle: 'Nồng độ cồn mức 1 (chưa vượt quá 50 mg/100 ml máu hoặc 0.25 mg/1 lít khí thở)',
    violationDetail: 'Điều khiển xe ô tô trên đường mà trong máu hoặc hơi thở có nồng độ cồn nhưng chưa vượt quá 50 miligam/100 mililít máu hoặc chưa vượt quá 0,25 miligam/1 lít khí thở.',
    minFineAmount: 6000000,
    maxFineAmount: 8000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 10 tháng đến 12 tháng.',
    legalReference: 'Điểm c Khoản 6 Điều 5 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 2,
    violationTitle: 'Nồng độ cồn mức 2 (vượt quá 50 đến 80 mg/100 ml máu hoặc 0.25 đến 0.4 mg/1 lít khí thở)',
    violationDetail: 'Điều khiển xe ô tô trên đường mà trong máu hoặc hơi thở có nồng độ cồn vượt quá 50 miligam đến 80 miligam/100 mililít máu hoặc vượt quá 0,25 miligam đến 0,4 miligam/1 lít khí thở.',
    minFineAmount: 16000000,
    maxFineAmount: 18000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 16 tháng đến 18 tháng.',
    legalReference: 'Điểm c Khoản 8 Điều 5 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 2,
    violationTitle: 'Nồng độ cồn kịch khung mức 3 (vượt quá 80 mg/100 ml máu hoặc vượt quá 0.4 mg/1 lít khí thở)',
    violationDetail: 'Điều khiển xe ô tô trên đường mà trong máu hoặc hơi thở có nồng độ cồn vượt quá 80 miligam/100 mililít máu hoặc vượt quá 0,4 miligam/1 lít khí thở hoặc không chấp hành yêu cầu kiểm tra.',
    minFineAmount: 30000000,
    maxFineAmount: 40000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 22 tháng đến 24 tháng.',
    legalReference: 'Điểm a Khoản 10 Điều 5 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 2,
    violationTitle: 'Chạy quá tốc độ quy định từ 05 km/h đến dưới 10 km/h',
    violationDetail: 'Điều khiển xe ô tô chạy quá tốc độ quy định từ 05 km/h đến dưới 10 km/h.',
    minFineAmount: 800000,
    maxFineAmount: 1000000,
    penaltyAddition: 'Không áp dụng hình phạt bổ sung.',
    legalReference: 'Điểm a Khoản 3 Điều 5 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },
  {
    fineCategoryId: 2,
    violationTitle: 'Chạy quá tốc độ quy định từ 10 km/h đến 20 km/h',
    violationDetail: 'Điều khiển xe ô tô chạy quá tốc độ quy định từ 10 km/h đến 20 km/h.',
    minFineAmount: 4000000,
    maxFineAmount: 6000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 01 tháng đến 03 tháng.',
    legalReference: 'Điểm i Khoản 5 Điều 5 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },
  {
    fineCategoryId: 2,
    violationTitle: 'Chạy quá tốc độ quy định từ 20 km/h đến 35 km/h',
    violationDetail: 'Điều khiển xe ô tô chạy quá tốc độ quy định từ 20 km/h đến 35 km/h.',
    minFineAmount: 6000000,
    maxFineAmount: 8000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 02 tháng đến 04 tháng.',
    legalReference: 'Điểm a Khoản 6 Điều 5 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 2,
    violationTitle: 'Chạy quá tốc độ quy định trên 35 km/h',
    violationDetail: 'Điều khiển xe ô tô chạy quá tốc độ quy định trên 35 km/h.',
    minFineAmount: 10000000,
    maxFineAmount: 12000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 02 tháng đến 04 tháng.',
    legalReference: 'Điểm c Khoản 7 Điều 5 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 2,
    violationTitle: 'Không chấp hành hiệu lệnh của đèn tín hiệu giao thông (Vượt đèn đỏ, đèn vàng)',
    violationDetail: 'Không chấp hành hiệu lệnh của đèn tín hiệu giao thông khi điều khiển xe ô tô.',
    minFineAmount: 4000000,
    maxFineAmount: 6000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 01 tháng đến 03 tháng.',
    legalReference: 'Điểm a Khoản 5 Điều 5 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },
  {
    fineCategoryId: 2,
    violationTitle: 'Đi ngược chiều trên đường một chiều hoặc đường có biển cấm đi ngược chiều',
    violationDetail: 'Đi ngược chiều của đường một chiều, đi ngược chiều trên đường có biển “Cấm đi ngược chiều”, trừ các xe ưu tiên đang làm nhiệm vụ.',
    minFineAmount: 4000000,
    maxFineAmount: 6000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 02 tháng đến 04 tháng.',
    legalReference: 'Điểm c Khoản 5 Điều 5 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },
  {
    fineCategoryId: 2,
    violationTitle: 'Lùi xe, đi ngược chiều trên đường cao tốc',
    violationDetail: 'Điều khiển xe đi ngược chiều trên đường cao tốc, lùi xe trên đường cao tốc (trừ các xe ưu tiên đang đi làm nhiệm vụ khẩn cấp).',
    minFineAmount: 16000000,
    maxFineAmount: 18000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 05 tháng đến 07 tháng.',
    legalReference: 'Điểm a Khoản 8 Điều 5 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 2,
    violationTitle: 'Dùng tay sử dụng điện thoại di động khi đang lái xe',
    violationDetail: 'Dùng tay sử dụng điện thoại di động khi đang điều khiển xe chạy trên đường.',
    minFineAmount: 2000000,
    maxFineAmount: 3000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 01 tháng đến 03 tháng.',
    legalReference: 'Điểm a Khoản 4 Điều 5 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },
  {
    fineCategoryId: 2,
    violationTitle: 'Không thắt dây an toàn khi điều khiển xe hoặc chở người không thắt dây an toàn',
    violationDetail: 'Không thắt dây an toàn khi điều khiển xe chạy trên đường; chở người trên xe ô tô không thắt dây an toàn tại vị trí có trang bị dây an toàn.',
    minFineAmount: 800000,
    maxFineAmount: 1000000,
    penaltyAddition: 'Không áp dụng hình phạt bổ sung.',
    legalReference: 'Điểm q, p Khoản 3 Điều 5 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },
  {
    fineCategoryId: 2,
    violationTitle: 'Điều khiển xe chạy ở làn dừng xe khẩn cấp trên đường cao tốc',
    violationDetail: 'Điều khiển xe chạy ở làn dừng xe khẩn cấp hoặc phần lề đường của đường cao tốc; không nhường đường cho xe ưu tiên phát tín hiệu.',
    minFineAmount: 4000000,
    maxFineAmount: 6000000,
    penaltyAddition: 'Tước quyền sử dụng Giấy phép lái xe từ 01 tháng đến 03 tháng.',
    legalReference: 'Điểm g Khoản 5 Điều 5 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },
  {
    fineCategoryId: 2,
    violationTitle: 'Không có Giấy phép lái xe ô tô hoặc dùng GPLX không do thẩm quyền cấp',
    violationDetail: 'Người điều khiển xe ô tô và các loại xe tương tự xe ô tô không có Giấy phép lái xe hoặc sử dụng Giấy phép lái xe không do cơ quan có thẩm quyền cấp.',
    minFineAmount: 10000000,
    maxFineAmount: 12000000,
    penaltyAddition: 'Tịch thu Giấy phép lái xe không hợp lệ, tạm giữ phương tiện đến 07 ngày.',
    legalReference: 'Điểm b Khoản 9 Điều 21 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },

  // ===========================================================================
  // NHÓM 3: XE ĐẠP, XE THÔ SƠ, NGƯỜI ĐI BỘ (fine_category_id = 3)
  // ===========================================================================
  {
    fineCategoryId: 3,
    violationTitle: 'Người đi bộ không đi đúng phần đường quy định, vượt dải phân cách',
    violationDetail: 'Không đi đúng phần đường quy định; vượt qua dải phân cách; đi qua đường không đúng nơi quy định hoặc không bảo đảm an toàn.',
    minFineAmount: 60000,
    maxFineAmount: 100000,
    penaltyAddition: 'Không áp dụng hình phạt bổ sung.',
    legalReference: 'Điểm a Khoản 1 Điều 9 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 3,
    violationTitle: 'Người đi bộ đi vào đường cao tốc',
    violationDetail: 'Người đi bộ đi vào đường cao tốc, trừ người phục vụ việc quản lý, bảo trì đường cao tốc.',
    minFineAmount: 100000,
    maxFineAmount: 200000,
    penaltyAddition: 'Không áp dụng hình phạt bổ sung.',
    legalReference: 'Khoản 2 Điều 9 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 3,
    violationTitle: 'Người đi xe đạp, xe đạp điện không chấp hành hiệu lệnh đèn tín hiệu (vượt đèn đỏ)',
    violationDetail: 'Không chấp hành hiệu lệnh của đèn tín hiệu giao thông khi điều khiển xe đạp, xe đạp điện, xe thô sơ.',
    minFineAmount: 100000,
    maxFineAmount: 200000,
    penaltyAddition: 'Không áp dụng hình phạt bổ sung.',
    legalReference: 'Điểm đ Khoản 2 Điều 8 NĐ 100/2019, sửa đổi bởi NĐ 123/2021'
  },
  {
    fineCategoryId: 3,
    violationTitle: 'Người đi xe đạp có nồng độ cồn vượt quá 80 mg/100 ml máu (hoặc quá 0.4 mg/1 lít khí thở)',
    violationDetail: 'Điều khiển xe đạp, xe đạp điện trên đường mà trong máu hoặc hơi thở có nồng độ cồn vượt quá 80 miligam/100 mililít máu hoặc vượt quá 0,4 miligam/1 lít khí thở.',
    minFineAmount: 400000,
    maxFineAmount: 600000,
    penaltyAddition: 'Tạm giữ phương tiện đến 07 ngày.',
    legalReference: 'Điểm q Khoản 4 Điều 8 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 3,
    violationTitle: 'Điều khiển xe thô sơ, xe đạp đi vào đường cao tốc',
    violationDetail: 'Điều khiển xe đạp, xe thô sơ đi vào đường cao tốc, trừ phương tiện phục vụ việc quản lý, bảo trì đường cao tốc.',
    minFineAmount: 400000,
    maxFineAmount: 600000,
    penaltyAddition: 'Tạm giữ phương tiện đến 07 ngày.',
    legalReference: 'Khoản 4 Điều 8 Nghị định 100/2019/NĐ-CP'
  },
  {
    fineCategoryId: 3,
    violationTitle: 'Đi xe đạp buông cả hai tay, dàn hàng ngang từ 03 xe trở lên',
    violationDetail: 'Buông cả hai tay khi đang điều khiển xe đạp; điều khiển xe dàn hàng ngang từ 03 xe trở lên trên đường.',
    minFineAmount: 80000,
    maxFineAmount: 100000,
    penaltyAddition: 'Không áp dụng hình phạt bổ sung.',
    legalReference: 'Điểm a, c Khoản 1 Điều 8 Nghị định 100/2019/NĐ-CP'
  }
];

/**
 * Hàm nạp toàn bộ dữ liệu Biển báo & Mức phạt vào CSDL MySQL
 */
async function seedSignsAndFines() {
  console.log('🔄 Bắt đầu nạp dữ liệu Biển báo và Mức xử phạt vào MySQL...');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Dọn dẹp dữ liệu cũ nếu muốn làm mới
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE traffic_signs');
    await connection.query('TRUNCATE TABLE traffic_fines');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 2. Nạp dữ liệu Biển báo (traffic_signs)
    console.log(`➡️  Đang nạp ${trafficSignsData.length} biển báo giao thông...`);
    for (const sign of trafficSignsData) {
      await connection.query(
        `INSERT INTO traffic_signs (category_id, sign_code, name, description, image_url)
         VALUES (?, ?, ?, ?, ?)`,
        [sign.categoryId, sign.signCode, sign.name, sign.description, sign.imageUrl]
      );
    }

    // 3. Nạp dữ liệu Mức xử phạt (traffic_fines)
    console.log(`➡️  Đang nạp ${trafficFinesData.length} mức xử phạt vi phạm giao thông...`);
    for (const fine of trafficFinesData) {
      await connection.query(
        `INSERT INTO traffic_fines (fine_category_id, violation_title, violation_detail, min_fine_amount, max_fine_amount, penalty_addition, legal_reference)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          fine.fineCategoryId,
          fine.violationTitle,
          fine.violationDetail,
          fine.minFineAmount,
          fine.maxFineAmount,
          fine.penaltyAddition,
          fine.legalReference
        ]
      );
    }

    await connection.commit();
    console.log('✅ Nạp dữ liệu thành công!');
    console.log(`   - Tổng số biển báo: ${trafficSignsData.length}`);
    console.log(`   - Tổng số mức phạt: ${trafficFinesData.length}`);
  } catch (error) {
    await connection.rollback();
    console.error('❌ Lỗi nạp dữ liệu Biển báo & Mức phạt:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = seedSignsAndFines;

if (require.main === module) {
  seedSignsAndFines()
    .then(() => {
      console.log('🎉 Hoàn tất quá trình seed Biển báo & Mức phạt!');
      pool.end();
    })
    .catch((err) => {
      console.error('💥 Seed thất bại:', err);
      process.exit(1);
    });
}
