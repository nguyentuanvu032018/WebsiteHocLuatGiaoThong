const { pool } = require('../../src/config/db.config');

/**
 * BỘ DỮ LIỆU SEED CÂU HỎI & ĐÁP ÁN CHUẨN BỘ GTVT
 * Đầy đủ 7 chương, gắn nhãn chính xác câu điểm liệt (is_paralysis = 1),
 * đáp án đúng (is_correct = 1) và lời giải thích chi tiết.
 */
const questionsData = [
  // ===========================================================================
  // CHƯƠNG I: KHÁI NIỆM VÀ QUY TẮC GIAO THÔNG ĐƯỜNG BỘ
  // ===========================================================================
  {
    chapterId: 1,
    content: 'Hành vi điều khiển xe cơ giới chạy quá tốc độ quy định, giành đường, vượt ẩu có bị nghiêm cấm hay không?',
    isParalysis: 1, // CÂU ĐIỂM LIỆT
    explanation: 'Hành vi chạy quá tốc độ, giành đường, vượt ẩu là nguyên nhân hàng đầu gây tai nạn giao thông nghiêm trọng nên bị nghiêm cấm hoàn toàn.',
    answers: [
      { text: 'Bị nghiêm cấm tùy từng trường hợp.', isCorrect: 0 },
      { text: 'Bị nghiêm cấm.', isCorrect: 1 },
      { text: 'Không bị nghiêm cấm nếu đường vắng.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 1,
    content: 'Người điều khiển phương tiện tham gia giao thông đường bộ mà trong cơ thể có chất ma túy có bị nghiêm cấm hay không?',
    isParalysis: 1, // CÂU ĐIỂM LIỆT
    explanation: 'Sử dụng ma túy làm mất kiểm soát hành vi, phản xạ thần kinh nên tuyệt đối bị nghiêm cấm khi lái xe.',
    answers: [
      { text: 'Bị nghiêm cấm.', isCorrect: 1 },
      { text: 'Không bị nghiêm cấm nếu chỉ sử dụng lượng nhỏ.', isCorrect: 0 },
      { text: 'Bị nghiêm cấm trên đường cao tốc, đường đô thị được phép.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 1,
    content: 'Người điều khiển xe mô tô, ô tô, máy kéo trên đường mà trong máu hoặc hơi thở có nồng độ cồn có bị nghiêm cấm không?',
    isParalysis: 1, // CÂU ĐIỂM LIỆT
    explanation: 'Theo Luật Phòng, chống tác hại của rượu, bia và Luật Giao thông đường bộ: Nghiêm cấm hoàn toàn việc điều khiển phương tiện tham gia giao thông mà trong máu hoặc hơi thở có nồng độ cồn.',
    answers: [
      { text: 'Bị nghiêm cấm.', isCorrect: 1 },
      { text: 'Không bị nghiêm cấm nếu nồng độ cồn ở mức thấp.', isCorrect: 0 },
      { text: 'Chỉ bị nghiêm cấm đối với người lái xe ô tô.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 1,
    content: 'Hành vi giao xe cơ giới, xe máy chuyên dùng cho người không đủ điều kiện để điều khiển xe tham gia giao thông có bị nghiêm cấm không?',
    isParalysis: 1, // CÂU ĐIỂM LIỆT
    explanation: 'Giao xe cho người chưa đủ tuổi, không có giấy phép lái xe hoặc đã sử dụng rượu bia, ma túy là hành vi bị nghiêm cấm và có thể bị truy cứu trách nhiệm hình sự.',
    answers: [
      { text: 'Không bị nghiêm cấm.', isCorrect: 0 },
      { text: 'Bị nghiêm cấm.', isCorrect: 1 },
      { text: 'Chỉ bị xử phạt hành chính khi xảy ra tai nạn.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 1,
    content: 'Người lái xe không được lùi xe ở những khu vực nào dưới đây?',
    isParalysis: 1, // CÂU ĐIỂM LIỆT
    explanation: 'Tuyệt đối không được lùi xe ở khu vực cấm dừng đỗ, nơi đường bộ giao nhau, đường giao nhau cùng mức với đường sắt, nơi tầm nhìn bị che khuất, trong hầm đường bộ và trên đường cao tốc.',
    answers: [
      { text: 'Ở khu vực cho phép đỗ xe.', isCorrect: 0 },
      { text: 'Ở khu vực cấm dừng và trên phần đường dành cho người đi bộ qua đường.', isCorrect: 0 },
      { text: 'Nơi đường bộ giao nhau, đường bộ giao nhau cùng mức với đường sắt, nơi tầm nhìn bị che khuất, trong hầm đường bộ, đường cao tốc.', isCorrect: 1 },
      { text: 'Cả ý 2 và ý 3.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 1,
    content: '"Phần đường xe chạy" được hiểu như thế nào là đúng?',
    isParalysis: 0,
    explanation: 'Phần đường xe chạy là phần của đường bộ được sử dụng cho phương tiện giao thông qua lại.',
    answers: [
      { text: 'Là phần của đường bộ được sử dụng cho các phương tiện giao thông qua lại.', isCorrect: 1 },
      { text: 'Là phần đường bộ bao gồm cả lề đường và hè phố.', isCorrect: 0 },
      { text: 'Là dải đất dọc hai bên đường để bảo đảm an toàn giao thông.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 1,
    content: '"Làn đường" là gì?',
    isParalysis: 0,
    explanation: 'Làn đường là một phần của phần đường xe chạy được chia theo chiều dọc của đường, có bề rộng đủ cho xe chạy an toàn.',
    answers: [
      { text: 'Là một phần của phần đường xe chạy được chia theo chiều dọc của đường, có bề rộng đủ cho xe chạy an toàn.', isCorrect: 1 },
      { text: 'Là đường dành riêng cho xe cơ giới chạy.', isCorrect: 0 },
      { text: 'Là đường dành riêng cho người đi bộ và xe thô sơ.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 1,
    content: 'Khái niệm "Dải phân cách" được hiểu như thế nào là đúng?',
    isParalysis: 0,
    explanation: 'Dải phân cách là bộ phận của đường để phân chia mặt đường thành hai chiều xe chạy riêng biệt hoặc để phân chia phần đường của xe cơ giới và xe thô sơ.',
    answers: [
      { text: 'Là bộ phận của đường để ngăn cách không cho các loại xe vào nơi không được phép.', isCorrect: 0 },
      { text: 'Là bộ phận của đường để phân chia mặt đường thành hai chiều xe chạy riêng biệt hoặc để phân chia phần đường của xe cơ giới và xe thô sơ.', isCorrect: 1 },
      { text: 'Là dải phân chia làn đường của người đi bộ với xe cơ giới.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 1,
    content: 'Tại nơi đường giao nhau không có báo hiệu đi theo vòng xuyến, người điều khiển phương tiện phải nhường đường như thế nào là đúng quy tắc giao thông?',
    isParalysis: 0,
    explanation: 'Quy tắc: Không vòng xuyến nhường bên PHẢI, có vòng xuyến nhường bên TRÁI.',
    answers: [
      { text: 'Phải nhường đường cho xe đi đến từ bên phải.', isCorrect: 1 },
      { text: 'Phải nhường đường cho xe đi đến từ bên trái.', isCorrect: 0 },
      { text: 'Phải nhường đường cho xe có trọng tải lớn hơn.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 1,
    content: 'Tại nơi đường giao nhau có báo hiệu đi theo vòng xuyến, người điều khiển phương tiện phải nhường đường như thế nào là đúng quy tắc giao thông?',
    isParalysis: 0,
    explanation: 'Tại nơi có báo hiệu vòng xuyến, phải nhường đường cho xe đi đến từ bên TRÁI.',
    answers: [
      { text: 'Phải nhường đường cho xe đi đến từ bên phải.', isCorrect: 0 },
      { text: 'Phải nhường đường cho xe đi đến từ bên trái.', isCorrect: 1 },
      { text: 'Xe nào phát tín hiệu xin đường trước thì được đi trước.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 1,
    content: 'Khi gặp một xe đang lùi xe từ trong ngõ ra đường chính, người lái xe phải xử lý như thế nào để đảm bảo an toàn?',
    isParalysis: 0,
    explanation: 'Giảm tốc độ, chú ý quan sát hoặc dừng lại nhường đường nếu cần thiết để đảm bảo an toàn.',
    answers: [
      { text: 'Bấm còi liên tục và tăng tốc độ vượt qua.', isCorrect: 0 },
      { text: 'Giảm tốc độ, quan sát hoặc dừng lại nhường đường an toàn.', isCorrect: 1 },
      { text: 'Cố tình vượt lên phía trước đuôi xe đang lùi.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 1,
    content: 'Khi điều khiển xe chuyển làn đường, người lái xe phải thực hiện như thế nào để bảo đảm an toàn giao thông?',
    isParalysis: 0,
    explanation: 'Phải quan sát các xe phía trước, phía sau và bên cạnh; có tín hiệu báo trước và chỉ được chuyển làn ở nơi được phép.',
    answers: [
      { text: 'Quan sát gương, bật xi-nhan và chuyển làn ngay lập tức.', isCorrect: 0 },
      { text: 'Phải có tín hiệu báo trước, quan sát an toàn và chỉ được chuyển làn ở nơi được phép.', isCorrect: 1 },
      { text: 'Bấm còi và chuyển làn với tốc độ cao.', isCorrect: 0 }
    ]
  },

  // ===========================================================================
  // CHƯƠNG II: NGHIỆP VỤ VẬN TẢI
  // ===========================================================================
  {
    chapterId: 2,
    content: 'Thời gian làm việc của người lái xe ô tô không được lái xe liên tục quá bao nhiêu giờ trong các trường hợp dưới đây?',
    isParalysis: 0,
    explanation: 'Luật quy định: Thời gian lái xe liên tục không được quá 4 giờ để tránh mệt mỏi gây buồn ngủ.',
    answers: [
      { text: 'Không quá 3 giờ.', isCorrect: 0 },
      { text: 'Không quá 4 giờ.', isCorrect: 1 },
      { text: 'Không quá 5 giờ.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 2,
    content: 'Thời gian làm việc trong một ngày của người lái xe ô tô không được vượt quá bao nhiêu giờ trong các trường hợp dưới đây?',
    isParalysis: 0,
    explanation: 'Tổng thời gian lái xe trong 1 ngày không được vượt quá 10 giờ.',
    answers: [
      { text: 'Không quá 8 giờ.', isCorrect: 0 },
      { text: 'Không quá 10 giờ.', isCorrect: 1 },
      { text: 'Không quá 12 giờ.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 2,
    content: 'Người lái xe vận tải hành khách khi thực hiện đón, trả khách phải tuân thủ quy định nào dưới đây?',
    isParalysis: 0,
    explanation: 'Đón, trả khách đúng nơi quy định, không chở quá số người quy định, không để hàng hóa lẫn với hành khách.',
    answers: [
      { text: 'Đón, trả khách ở bất cứ vị trí nào khách yêu cầu.', isCorrect: 0 },
      { text: 'Chỉ đón, trả khách tại nơi quy định, không chở quá số người được phép.', isCorrect: 1 },
      { text: 'Được phép chở hàng hóa có mùi hôi hám trong khoang hành khách.', isCorrect: 0 }
    ]
  },

  // ===========================================================================
  // CHƯƠNG III: VĂN HÓA, ĐẠO ĐỨC NGƯỜI LÁI XE
  // ===========================================================================
  {
    chapterId: 3,
    content: 'Khái niệm "Văn hóa giao thông" được hiểu như thế nào là đúng?',
    isParalysis: 0,
    explanation: 'Văn hóa giao thông là sự hiểu biết và chấp hành nghiêm chỉnh luật, đồng thời có ý thức trách nhiệm và tính cộng đồng khi tham gia giao thông.',
    answers: [
      { text: 'Là sự hiểu biết và chấp hành nghiêm chỉnh pháp luật về giao thông.', isCorrect: 0 },
      { text: 'Là ý thức trách nhiệm với cộng đồng, có hành vi ứng xử văn minh, tôn trọng người khác.', isCorrect: 0 },
      { text: 'Cả ý 1 và ý 2.', isCorrect: 1 }
    ]
  },
  {
    chapterId: 3,
    content: 'Khi xảy ra tai nạn giao thông, người lái xe và người có mặt tại hiện trường có trách nhiệm gì?',
    isParalysis: 1, // CÂU ĐIỂM LIỆT
    explanation: 'Bắt buộc phải dừng xe, giữ nguyên hiện trường, kịp thời cứu chữa người bị thương và thông báo cho cơ quan công an gần nhất.',
    answers: [
      { text: 'Dừng ngay phương tiện, giữ nguyên hiện trường, trợ giúp cứu nạn và báo ngay cơ quan công an.', isCorrect: 1 },
      { text: 'Nhanh chóng rời khỏi hiện trường để tránh bị liên lụy.', isCorrect: 0 },
      { text: 'Chỉ cứu người nếu người đó là người quen của mình.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 3,
    content: 'Khi gặp người đi bộ qua đường tại nơi có vạch kẻ đường dành cho người đi bộ, người lái xe phải xử lý như thế nào?',
    isParalysis: 0,
    explanation: 'Phải giảm tốc độ, nhường đường cho người đi bộ qua đường an toàn.',
    answers: [
      { text: 'Giảm tốc độ, nhường đường cho người đi bộ qua đường an toàn.', isCorrect: 1 },
      { text: 'Bấm còi thật to để người đi bộ tránh đường cho xe đi qua.', isCorrect: 0 },
      { text: 'Tăng tốc độ chạy qua trước khi người đi bộ bước tới.', isCorrect: 0 }
    ]
  },

  // ===========================================================================
  // CHƯƠNG IV: KỸ THUẬT LÁI XE Ô TÔ
  // ===========================================================================
  {
    chapterId: 4,
    content: 'Khi điều khiển ô tô xuống dốc dài, dốc cao, người lái xe cần thực hiện các thao tác nào dưới đây để đảm bảo an toàn?',
    isParalysis: 0,
    explanation: 'Xuống dốc dài phải về số thấp (số 1 hoặc số 2, hoặc chế độ L/S) để tận dụng lực hãm của động cơ, tuyệt đối không được về số N (Mo) hoặc tắt máy.',
    answers: [
      { text: 'Nhả bàn đạp ga, về số Mo (N), đạp phanh chân liên tục.', isCorrect: 0 },
      { text: 'Về số thấp, nhả bàn đạp ga, kết hợp phanh chân với mức độ phù hợp để kiểm soát tốc độ.', isCorrect: 1 },
      { text: 'Tắt máy thả trôi xe xuống dốc để tiết kiệm nhiên liệu.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 4,
    content: 'Khi lái xe qua đường ngập nước sâu, người lái xe ô tô cần thực hiện thao tác nào để tránh hiện tượng thủy kích làm hỏng động cơ?',
    isParalysis: 0,
    explanation: 'Giữ đều ga ở số thấp, không giảm ga đột ngột, quan sát mức nước và tuyệt đối không khởi động lại động cơ nếu xe bị tắt máy trong vùng ngập.',
    answers: [
      { text: 'Tăng ga thật mạnh để vượt qua nhanh vùng nước.', isCorrect: 0 },
      { text: 'Về số thấp, giữ đều ga vừa phải, không thốc ga và không ngớt ga đột ngột.', isCorrect: 1 },
      { text: 'Nếu xe bị tắt máy, nhấn nút đề khởi động lại ngay lập tức.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 4,
    content: 'Để đạt hiệu quả phanh cao nhất, người lái xe mô tô hai bánh cần sử dụng các thao tác như thế nào?',
    isParalysis: 0,
    explanation: 'Giảm hết ga, đồng thời phối hợp nhịp nhàng phanh cả bánh trước và bánh sau.',
    answers: [
      { text: 'Chỉ sử dụng phanh trước thật mạnh.', isCorrect: 0 },
      { text: 'Chỉ sử dụng phanh sau thật mạnh.', isCorrect: 0 },
      { text: 'Giảm hết ga, kết hợp sử dụng đồng thời cả phanh trước và phanh sau.', isCorrect: 1 }
    ]
  },
  {
    chapterId: 4,
    content: 'Khi điều khiển xe ô tô trong điều kiện trời mưa to hoặc có sương mù, người lái xe cần làm gì?',
    isParalysis: 0,
    explanation: 'Bật đèn chiếu gần và đèn sương mù, giảm tốc độ, giữ khoảng cách an toàn lớn hơn bình thường.',
    answers: [
      { text: 'Bật đèn pha chiếu xa để nhìn rõ đường hơn.', isCorrect: 0 },
      { text: 'Bật đèn chiếu gần và đèn sương mù, giảm tốc độ, tăng khoảng cách an toàn với xe phía trước.', isCorrect: 1 },
      { text: 'Chạy bám sát xe phía trước để dễ đi theo vệt xe chạy.', isCorrect: 0 }
    ]
  },

  // ===========================================================================
  // CHƯƠNG V: CẤU TẠO VÀ SỬA CHỮA XE Ô TÔ
  // ===========================================================================
  {
    chapterId: 5,
    content: 'Dây đai an toàn được lắp trên ô tô có tác dụng gì dưới đây?',
    isParalysis: 0,
    explanation: 'Giữ chặt người ngồi trên ghế khi xe ô tô phanh gấp hoặc có va chạm mạnh, giảm thiểu chấn thương.',
    answers: [
      { text: 'Giữ chặt người ngồi trên ghế khi xe phanh gấp hoặc va chạm.', isCorrect: 1 },
      { text: 'Để giúp người ngồi không bị say xe.', isCorrect: 0 },
      { text: 'Để xe trông sang trọng và hiện đại hơn.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 5,
    content: 'Túi khí được trang bị trên xe ô tô có tác dụng gì?',
    isParalysis: 0,
    explanation: 'Túi khí nổ bung ra giúp giảm chấn thương vùng đầu, ngực khi có va chạm mạnh xảy ra.',
    answers: [
      { text: 'Giữ chặt người lái xe vào ghế lái.', isCorrect: 0 },
      { text: 'Giảm thiểu mức độ va đập của người ngồi trong xe với các bộ phận cứng của xe khi có va chạm mạnh.', isCorrect: 1 },
      { text: 'Tự động mở cửa xe khi xe rơi xuống nước.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 5,
    content: 'Hệ thống chống bó cứng phanh (ABS) trên xe ô tô có tác dụng gì?',
    isParalysis: 0,
    explanation: 'ABS giúp bánh xe không bị bó cứng khi phanh khẩn cấp, duy trì độ bám đường và khả năng đánh lái điều khiển hướng di chuyển của xe.',
    answers: [
      { text: 'Tăng lực phanh lên mức tối đa.', isCorrect: 0 },
      { text: 'Chống bó cứng bánh xe khi phanh khẩn cấp, giúp người lái xe duy trì khả năng điều khiển hướng xe.', isCorrect: 1 },
      { text: 'Tự động dừng xe khi gặp chướng ngại vật phía trước.', isCorrect: 0 }
    ]
  },

  // ===========================================================================
  // CHƯƠNG VI: HỆ THỐNG BIỂN BÁO HIỆU ĐƯỜNG BỘ
  // ===========================================================================
  {
    chapterId: 6,
    content: 'Biển báo nào dưới đây là "Biển cấm ô tô"?',
    imageUrl: '/signs/P103a.png',
    isParalysis: 0,
    explanation: 'Biển P.103a hình tròn, viền đỏ, nền trắng, vẽ hình ô tô con màu đen là biển cấm các loại xe cơ giới kể cả ô tô con đi vào.',
    answers: [
      { text: 'Biển 1 (P.103a).', isCorrect: 1 },
      { text: 'Biển 2 (P.104).', isCorrect: 0 },
      { text: 'Biển 3 (P.106a).', isCorrect: 0 }
    ]
  },
  {
    chapterId: 6,
    content: 'Biển nào cấm người đi bộ?',
    imageUrl: '/signs/P112.png',
    isParalysis: 0,
    explanation: 'Biển P.112 hình tròn viền đỏ, hình vẽ người đi bộ gạch chéo đỏ báo hiệu cấm người đi bộ qua lại.',
    answers: [
      { text: 'Biển 1.', isCorrect: 0 },
      { text: 'Biển 2 (P.112).', isCorrect: 1 },
      { text: 'Biển 3.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 6,
    content: 'Khi gặp biển nào dưới đây, người lái xe không được phép quay đầu xe?',
    imageUrl: '/signs/P124a.png',
    isParalysis: 0,
    explanation: 'Biển P.124a cấm quay đầu xe (hình mũi tên chữ U gạch chéo đỏ).',
    answers: [
      { text: 'Biển 1 (P.124a).', isCorrect: 1 },
      { text: 'Biển 2 (P.123a).', isCorrect: 0 },
      { text: 'Cả hai biển.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 6,
    content: 'Biển báo nào dưới đây báo hiệu "Giao nhau với đường ưu tiên"?',
    imageUrl: '/signs/W208.png',
    isParalysis: 0,
    explanation: 'Biển W.208 hình tam giác đều ngược (đỉnh quay xuống dưới), viền đỏ, nền vàng là biển giao nhau với đường ưu tiên. Xe đi trên đường này phải nhường đường.',
    answers: [
      { text: 'Biển 1.', isCorrect: 0 },
      { text: 'Biển 2.', isCorrect: 0 },
      { text: 'Biển 3 (W.208).', isCorrect: 1 }
    ]
  },
  {
    chapterId: 6,
    content: 'Biển báo nào báo hiệu đoạn đường "Hay xảy ra trơn trượt khi trời mưa"?',
    imageUrl: '/signs/W222a.png',
    isParalysis: 0,
    explanation: 'Biển W.222a vẽ chiếc xe có vết trượt ngoằn ngoèo cảnh báo đường trơn trượt.',
    answers: [
      { text: 'Biển 1.', isCorrect: 0 },
      { text: 'Biển 2 (W.222a).', isCorrect: 1 },
      { text: 'Biển 3.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 6,
    content: 'Biển nào dưới đây là "Biển hiệu lệnh bắt buộc các phương tiện phải đi thẳng"?',
    imageUrl: '/signs/R301a.png',
    isParalysis: 0,
    explanation: 'Biển R.301a hình tròn nền xanh lam, mũi tên trắng hướng thẳng lên trên là biển hiệu lệnh các xe chỉ được đi thẳng.',
    answers: [
      { text: 'Biển 1 (R.301a).', isCorrect: 1 },
      { text: 'Biển 2.', isCorrect: 0 },
      { text: 'Biển 3.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 6,
    content: 'Biển nào báo hiệu "Tốc độ tối đa cho phép vào ban đêm"?',
    imageUrl: '/signs/P127b.png',
    isParalysis: 0,
    explanation: 'Biển P.127b có ghi rõ khoảng thời gian áp dụng vào ban đêm (VD: 22h - 5h).',
    answers: [
      { text: 'Biển 1 (P.127).', isCorrect: 0 },
      { text: 'Biển 2 (P.127b).', isCorrect: 1 },
      { text: 'Không có biển nào.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 6,
    content: 'Biển nào báo hiệu "Đường dành cho người tàn tật, xe lăn"?',
    imageUrl: '/signs/I435.png',
    isParalysis: 0,
    explanation: 'Biển I.435 hình vuông xanh lam có biểu tượng người ngồi trên xe lăn.',
    answers: [
      { text: 'Biển 1.', isCorrect: 0 },
      { text: 'Biển 2 (I.435).', isCorrect: 1 },
      { text: 'Biển 3.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 6,
    content: 'Gặp biển nào dưới đây các xe không được phép vượt nhau?',
    imageUrl: '/signs/P125.png',
    isParalysis: 0,
    explanation: 'Biển P.125 có hình hai ô tô cạnh nhau (ô tô bên trái màu đỏ) là biển cấm vượt.',
    answers: [
      { text: 'Biển 1 (P.125).', isCorrect: 1 },
      { text: 'Biển 2.', isCorrect: 0 },
      { text: 'Biển 3.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 6,
    content: 'Biển nào báo hiệu "Đoạn đường thường xuyên có trẻ em đi ngang qua"?',
    imageUrl: '/signs/W225.png',
    isParalysis: 0,
    explanation: 'Biển W.225 tam giác vàng viền đỏ vẽ hai em nhỏ dắt tay nhau qua đường.',
    answers: [
      { text: 'Biển 1.', isCorrect: 0 },
      { text: 'Biển 2 (W.225).', isCorrect: 1 },
      { text: 'Biển 3.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 6,
    content: 'Biển báo nào dưới đây chỉ dẫn bắt đầu đường cao tốc?',
    imageUrl: '/signs/R437.png',
    isParalysis: 0,
    explanation: 'Biển R.437 hình chữ nhật màu xanh lam, có ký hiệu đường cao tốc và cầu vượt.',
    answers: [
      { text: 'Biển 1 (R.437).', isCorrect: 1 },
      { text: 'Biển 2.', isCorrect: 0 },
      { text: 'Biển 3.', isCorrect: 0 }
    ]
  },

  // ===========================================================================
  // CHƯƠNG VII: GIẢI CÁC THẾ SA HÌNH VÀ TÌNH HUỐNG GIAO THÔNG
  // ===========================================================================
  {
    chapterId: 7,
    content: 'Thứ tự các xe đi như thế nào là đúng quy tắc giao thông trong tình huống này?',
    imageUrl: '/signs/sahinh_01.png',
    isParalysis: 0,
    explanation: 'Quy tắc thứ tự ưu tiên: Xe ưu tiên (Cứu hỏa > Công an) $\\rightarrow$ Đường ưu tiên $\\rightarrow$ Đường nhánh. Xe cứu hỏa luôn được quyền đi trước xe công an.',
    answers: [
      { text: 'Xe công an, Xe cứu hỏa, Xe con.', isCorrect: 0 },
      { text: 'Xe cứu hỏa, Xe công an, Xe con.', isCorrect: 1 },
      { text: 'Xe con, Xe cứu hỏa, Xe công an.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 7,
    content: 'Xe nào phải dừng lại trong trường hợp tín hiệu đèn giao thông dưới đây?',
    imageUrl: '/signs/sahinh_02.png',
    isParalysis: 0,
    explanation: 'Đèn đỏ bật sáng tại làn xe tải và xe con, do đó xe tải và xe con phải dừng lại.',
    answers: [
      { text: 'Xe con và xe tải.', isCorrect: 1 },
      { text: 'Xe khách và xe mô tô.', isCorrect: 0 },
      { text: 'Tất cả các xe.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 7,
    content: 'Theo hướng mũi tên, những hướng nào xe mô tô được phép đi?',
    imageUrl: '/signs/sahinh_03.png',
    isParalysis: 0,
    explanation: 'Hướng 2 có biển cấm xe mô tô đi vào, do đó xe mô tô chỉ được phép đi Hướng 1 và Hướng 3.',
    answers: [
      { text: 'Cả ba hướng.', isCorrect: 0 },
      { text: 'Hướng 1 và 2.', isCorrect: 0 },
      { text: 'Hướng 1 và 3.', isCorrect: 1 }
    ]
  },
  {
    chapterId: 7,
    content: 'Xe nào được quyền đi trước trong trường hợp dưới đây?',
    imageUrl: '/signs/sahinh_04.png',
    isParalysis: 0,
    explanation: 'Xe cứu thương đang phát tín hiệu ưu tiên làm nhiệm vụ khẩn cấp nên được đi trước xe con.',
    answers: [
      { text: 'Xe con.', isCorrect: 0 },
      { text: 'Xe cứu thương.', isCorrect: 1 }
    ]
  },
  {
    chapterId: 7,
    content: 'Xe nào vi phạm quy tắc giao thông khi quay đầu đè lên vạch kẻ liền dành cho người đi bộ?',
    imageUrl: '/signs/sahinh_05.png',
    isParalysis: 0,
    explanation: 'Cấm quay đầu xe trên phần đường dành cho người đi bộ qua đường.',
    answers: [
      { text: 'Xe tải.', isCorrect: 0 },
      { text: 'Xe con.', isCorrect: 1 },
      { text: 'Cả hai xe đều không vi phạm.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 7,
    content: 'Trong hình dưới đây, các xe đi theo hướng mũi tên, xe nào vi phạm quy tắc giao thông?',
    imageUrl: '/signs/sahinh_06.png',
    isParalysis: 0,
    explanation: 'Xe tải ở làn bắt buộc rẽ phải nhưng lại đi thẳng là vi phạm quy tắc giao thông.',
    answers: [
      { text: 'Xe khách, xe tải.', isCorrect: 0 },
      { text: 'Xe tải.', isCorrect: 1 },
      { text: 'Xe con, xe mô tô.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 7,
    content: 'Tại ngã tư không có biển báo hiệu, xe nào được quyền đi trước theo nguyên tắc bên phải không vướng?',
    imageUrl: '/signs/sahinh_07.png',
    isParalysis: 0,
    explanation: 'Ngã tư đồng cấp: xe nào có hướng bên phải không vướng sẽ được quyền đi trước.',
    answers: [
      { text: 'Xe mô tô.', isCorrect: 1 },
      { text: 'Xe con.', isCorrect: 0 },
      { text: 'Xe tải.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 7,
    content: 'Người lái xe điều khiển xe rẽ trái như thế nào là đúng quy tắc giao thông khi gặp xe đi thẳng?',
    imageUrl: '/signs/sahinh_08.png',
    isParalysis: 0,
    explanation: 'Quy tắc hướng đi: Xe đi thẳng được ưu tiên đi trước xe rẽ trái.',
    answers: [
      { text: 'Nhường đường cho xe đi thẳng đi trước.', isCorrect: 1 },
      { text: 'Tăng tốc rẽ nhanh qua trước đầu xe đi thẳng.', isCorrect: 0 },
      { text: 'Bấm còi báo hiệu xin nhường đường.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 7,
    content: 'Thứ tự các xe đi như thế nào là đúng quy tắc giao thông khi qua vòng xuyến?',
    imageUrl: '/signs/sahinh_09.png',
    isParalysis: 0,
    explanation: 'Xe đã vào trong giao lộ (chớm ngã tư) được quyền đi trước, tiếp theo nhường đường cho xe đi từ bên trái trong vòng xuyến.',
    answers: [
      { text: 'Xe con, xe tải, xe mô tô.', isCorrect: 0 },
      { text: 'Xe tải, xe con, xe mô tô.', isCorrect: 1 },
      { text: 'Xe mô tô, xe con, xe tải.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 7,
    content: 'Xe nào phải nhường đường khi qua đường hẹp có biển báo hiệu?',
    imageUrl: '/signs/sahinh_10.png',
    isParalysis: 0,
    explanation: 'Xe gặp biển cấm đi qua đường hẹp khi có xe đi ngược chiều (biển tròn mũi tên đỏ đi lên) phải nhường đường.',
    answers: [
      { text: 'Xe tải.', isCorrect: 1 },
      { text: 'Xe con.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 7,
    content: 'Xe của bạn đang di chuyển đến ngã tư có đèn xanh, nhưng phía trước đang bị ùn tắc, bạn phải xử lý như thế nào?',
    imageUrl: '/signs/sahinh_11.png',
    isParalysis: 0,
    explanation: 'Dù đèn xanh, nếu phía trước đang ùn tắc thì không được đi vào nút giao gây cản trở giao thông.',
    answers: [
      { text: 'Tiếp tục đi vào nút giao vì đang có đèn xanh.', isCorrect: 0 },
      { text: 'Dừng lại trước vạch dừng xe, không đi vào nút giao cho đến khi đường thông thoáng.', isCorrect: 1 },
      { text: 'Lái xe lấn sang làn đường ngược chiều để đi qua nhanh.', isCorrect: 0 }
    ]
  },
  {
    chapterId: 7,
    content: 'Gặp xe cảnh sát giao thông đang phát tín hiệu còi, đèn ưu tiên đi làm nhiệm vụ, bạn phải làm gì?',
    imageUrl: '/signs/sahinh_12.png',
    isParalysis: 1, // CÂU ĐIỂM LIỆT
    explanation: 'Phải giảm tốc độ, tấp sát vào lề đường bên phải hoặc dừng lại nhường đường, tuyệt đối không được cản trở xe ưu tiên.',
    answers: [
      { text: 'Giảm tốc độ, tránh hoặc dừng lại sát lề đường bên phải để nhường đường, không được gây cản trở.', isCorrect: 1 },
      { text: 'Tăng tốc độ chạy trước xe cảnh sát.', isCorrect: 0 },
      { text: 'Chạy song song bên cạnh xe cảnh sát.', isCorrect: 0 }
    ]
  }
];

async function seedQuestions() {
  console.log('🌱 Bắt đầu nạp dữ liệu ngân hàng câu hỏi & đáp án (CP-02.2)...');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Dọn dẹp dữ liệu câu hỏi cũ
    console.log('🧹 Đang làm sạch bảng questions và answers cũ...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE answers');
    await connection.query('TRUNCATE TABLE questions');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log(`📥 Đang nạp ${questionsData.length} câu hỏi chuẩn hóa...`);

    let paralysisCount = 0;
    let answerCount = 0;

    for (const q of questionsData) {
      if (q.isParalysis) paralysisCount++;

      // Chèn câu hỏi
      const [qResult] = await connection.query(
        `INSERT INTO questions (chapter_id, content, image_url, is_paralysis, explanation) 
         VALUES (?, ?, ?, ?, ?)`,
        [q.chapterId, q.content, q.imageUrl || null, q.isParalysis ? 1 : 0, q.explanation || '']
      );

      const questionId = qResult.insertId;

      // Chèn các đáp án của câu hỏi
      for (let i = 0; i < q.answers.length; i++) {
        const a = q.answers[i];
        answerCount++;
        await connection.query(
          `INSERT INTO answers (question_id, answer_text, is_correct, order_number) 
           VALUES (?, ?, ?, ?)`,
          [questionId, a.text, a.isCorrect ? 1 : 0, i + 1]
        );
      }
    }

    await connection.commit();
    console.log('✅ Đã nạp thành công vào CSDL MySQL!');
    console.log(`   - Tổng số câu hỏi: ${questionsData.length}`);
    console.log(`   - Số câu hỏi điểm liệt: ${paralysisCount}`);
    console.log(`   - Tổng số đáp án trắc nghiệm: ${answerCount}`);
  } catch (error) {
    await connection.rollback();
    console.error('❌ Lỗi khi nạp dữ liệu câu hỏi:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = seedQuestions;

if (require.main === module) {
  seedQuestions().then(() => {
    console.log('🎉 Hoàn thành nạp dữ liệu câu hỏi thành công!');
    pool.end();
  });
}
