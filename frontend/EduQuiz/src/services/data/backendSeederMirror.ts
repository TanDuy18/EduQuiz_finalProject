import type {
  EducationLevelCode,
  EducationLevelDto,
  QuestionOptionRecord,
  QuestionRecord,
  QuizRecord,
  SubjectDto,
} from "../../types/quiz";

/**
 * Backend Contract Seed Mirror (dataSource: "BACKEND_SEEDER")
 * Mirrors EducationLevel, Subject, Quiz & Question samples defined in:
 * backend/backend/src/main/java/project/backend/config/DataSeeder.java
 */

export const BACKEND_EDUCATION_LEVELS: EducationLevelDto[] = [
  { id: 1, name: "THCS", code: "THCS", subtitle: "Lớp 6 - 9", orderIndex: 1, active: true },
  { id: 2, name: "THPT", code: "THPT", subtitle: "Lớp 10 - 12", orderIndex: 2, active: true },
  { id: 3, name: "Đại học", code: "UNIVERSITY", subtitle: "Tất cả các ngành", orderIndex: 3, active: true },
];

export const BACKEND_SEED_SUBJECTS: SubjectDto[] = [
  { id: "seed_sub_toan9", name: "Toán 9", description: "Toán lớp 9", levelCode: "THCS", categoryGroup: "NATURAL", colorKey: "math", quizCount: 18 },
  { id: "seed_sub_anh9", name: "Tiếng Anh 9", description: "Tiếng Anh lớp 9", levelCode: "THCS", categoryGroup: "LANGUAGE", colorKey: "english", quizCount: 15 },
  { id: "seed_sub_ly9", name: "Vật lí 9", description: "Vật lí lớp 9", levelCode: "THCS", categoryGroup: "NATURAL", colorKey: "physics", quizCount: 12 },
  { id: "seed_sub_toan12", name: "Toán 12", description: "Toán lớp 12", levelCode: "THPT", categoryGroup: "NATURAL", colorKey: "math", quizCount: 32 },
  { id: "seed_sub_ly12", name: "Vật lí 12", description: "Vật lí lớp 12", levelCode: "THPT", categoryGroup: "NATURAL", colorKey: "physics", quizCount: 24 },
  { id: "seed_sub_hoa12", name: "Hóa học 12", description: "Hóa học lớp 12", levelCode: "THPT", categoryGroup: "NATURAL", colorKey: "chemistry", quizCount: 20 },
  { id: "seed_sub_sinh12", name: "Sinh học 12", description: "Sinh học lớp 12", levelCode: "THPT", categoryGroup: "NATURAL", colorKey: "chemistry", quizCount: 16 },
  { id: "seed_sub_laptrinh", name: "Nhập môn lập trình", description: "Kiến thức nền tảng về lập trình", levelCode: "UNIVERSITY", categoryGroup: "NATURAL", colorKey: "math", quizCount: 28 },
  { id: "seed_sub_csdl", name: "Cơ sở dữ liệu", description: "Cơ sở dữ liệu và SQL", levelCode: "UNIVERSITY", categoryGroup: "NATURAL", colorKey: "physics", quizCount: 22 },
  { id: "seed_sub_mang", name: "Mạng máy tính", description: "Mạng máy tính căn bản", levelCode: "UNIVERSITY", categoryGroup: "NATURAL", colorKey: "english", quizCount: 19 },
];

const LABELS: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];

function makeOpts(qId: string, texts: string[], correctIdx: number[]): QuestionOptionRecord[] {
  return texts.map((content, idx) => ({
    id: `${qId}_opt_${idx + 1}`,
    label: LABELS[idx] ?? "A",
    content,
    isCorrect: correctIdx.includes(idx),
    orderIndex: idx + 1,
  }));
}

function makeQ(
  quizId: string,
  orderIndex: number,
  subjectName: string,
  levelCode: EducationLevelCode,
  content: string,
  options: string[],
  correctIdx: number[],
  explanation: string,
): QuestionRecord {
  const id = `${quizId}_q${orderIndex}`;
  return {
    id,
    code: `S${quizId.slice(-2).toUpperCase()}${String(orderIndex).padStart(2, "0")}`,
    quizId,
    subjectName,
    levelCode,
    content,
    type: correctIdx.length > 1 ? "MULTIPLE_CHOICE" : options.length === 2 ? "TRUE_FALSE" : "SINGLE_CHOICE",
    difficulty: orderIndex <= 4 ? "EASY" : orderIndex <= 8 ? "MEDIUM" : "HARD",
    explanation,
    score: 1,
    orderIndex,
    approvalStatus: "APPROVED",
    options: makeOpts(id, options, correctIdx),
    dataSource: "BACKEND_SEEDER",
  };
}

export const BACKEND_SEED_QUIZZES: QuizRecord[] = [
  {
    id: "seed_quiz_toan9",
    title: "Toán 9: Căn bậc hai và hệ phương trình",
    description: "Ôn căn bậc hai, hàm số bậc nhất, phương trình bậc hai và lượng giác.",
    subjectId: "sub_math",
    subjectName: "Toán",
    levelCode: "THCS",
    topicTag: "Đại số",
    durationMinutes: 30,
    questionCount: 5,
    difficulty: "MEDIUM",
    difficultyLabel: "Trung bình",
    rating: 4.7,
    ratingCountLabel: "420",
    attemptCountLabel: "3,2k",
    quizVisibility: "PUBLIC",
    quizStatus: "PUBLISHED",
    createdBy: "giangvien",
    updatedAt: "2026-11-18T08:00:00Z",
    dataSource: "BACKEND_SEEDER",
  },
  {
    id: "seed_quiz_anh9",
    title: "Tiếng Anh 9: Ngữ pháp trọng tâm",
    description: "Thì, câu điều kiện, câu bị động, câu hỏi đuôi và từ vựng cơ bản.",
    subjectId: "sub_english",
    subjectName: "Ngoại ngữ",
    levelCode: "THCS",
    topicTag: "Ngữ pháp",
    durationMinutes: 25,
    questionCount: 4,
    difficulty: "EASY",
    difficultyLabel: "Dễ",
    rating: 4.6,
    ratingCountLabel: "310",
    attemptCountLabel: "2,8k",
    quizVisibility: "PUBLIC",
    quizStatus: "PUBLISHED",
    createdBy: "giangvien",
    updatedAt: "2026-11-18T08:30:00Z",
    dataSource: "BACKEND_SEEDER",
  },
  {
    id: "seed_quiz_toan12",
    title: "Toán 12: Đạo hàm, nguyên hàm, tích phân",
    description: "Đạo hàm cơ bản, nguyên hàm, tích phân và hàm mũ, logarit.",
    subjectId: "sub_math",
    subjectName: "Toán",
    levelCode: "THPT",
    topicTag: "Giải tích",
    durationMinutes: 45,
    questionCount: 6,
    difficulty: "MEDIUM",
    difficultyLabel: "Trung bình khá",
    rating: 4.8,
    ratingCountLabel: "980",
    attemptCountLabel: "9,4k",
    isPopular: true,
    quizVisibility: "PUBLIC",
    quizStatus: "PUBLISHED",
    createdBy: "giangvien",
    updatedAt: "2026-11-19T09:00:00Z",
    dataSource: "BACKEND_SEEDER",
  },
  {
    id: "seed_quiz_hoa12",
    title: "Hóa học 12: Este, cacbohiđrat, polime",
    description: "Este, glucozơ, saccarozơ, amin và vật liệu polime.",
    subjectId: "sub_chemistry",
    subjectName: "Hóa học",
    levelCode: "THPT",
    topicTag: "Hữu cơ",
    durationMinutes: 45,
    questionCount: 5,
    difficulty: "MEDIUM",
    difficultyLabel: "Trung bình",
    rating: 4.7,
    ratingCountLabel: "610",
    attemptCountLabel: "5,6k",
    quizVisibility: "PUBLIC",
    quizStatus: "PUBLISHED",
    createdBy: "giangvien",
    updatedAt: "2026-11-19T10:00:00Z",
    dataSource: "BACKEND_SEEDER",
  },
  {
    id: "seed_quiz_laptrinh",
    title: "Nhập môn lập trình: Kiến thức nền tảng",
    description: "Biến, vòng lặp, cấu trúc dữ liệu, thuật toán và lập trình hướng đối tượng.",
    subjectId: "sub_programming",
    subjectName: "Lập trình",
    levelCode: "UNIVERSITY",
    topicTag: "Cơ bản",
    durationMinutes: 40,
    questionCount: 5,
    difficulty: "MEDIUM",
    difficultyLabel: "Trung bình",
    rating: 4.9,
    ratingCountLabel: "740",
    attemptCountLabel: "6,8k",
    isPopular: true,
    quizVisibility: "PUBLIC",
    quizStatus: "PUBLISHED",
    createdBy: "giangvien",
    updatedAt: "2026-11-20T07:00:00Z",
    dataSource: "BACKEND_SEEDER",
  },
  {
    id: "seed_quiz_csdl",
    title: "Cơ sở dữ liệu: SQL căn bản",
    description: "Truy vấn SQL, khóa, JOIN, giao dịch và chuẩn hóa.",
    subjectId: "sub_programming",
    subjectName: "Lập trình",
    levelCode: "UNIVERSITY",
    topicTag: "SQL",
    durationMinutes: 35,
    questionCount: 5,
    difficulty: "MEDIUM",
    difficultyLabel: "Trung bình",
    rating: 4.8,
    ratingCountLabel: "530",
    attemptCountLabel: "4,9k",
    quizVisibility: "PUBLIC",
    quizStatus: "PUBLISHED",
    createdBy: "giangvien",
    updatedAt: "2026-11-20T08:00:00Z",
    dataSource: "BACKEND_SEEDER",
  },
];

export const BACKEND_SEED_QUESTIONS: QuestionRecord[] = [
  // Toán 9 (DataSeeder.java lines 115-134)
  makeQ("seed_quiz_toan9", 1, "Toán", "THCS", "Căn bậc hai số học của 81 là:", ["9", "−9", "81", "3"], [0], "√81 = 9 vì 9² = 81 và 9 ≥ 0."),
  makeQ("seed_quiz_toan9", 2, "Toán", "THCS", "Giá trị của biểu thức √(3²) + √16 bằng:", ["5", "7", "25", "12"], [1], "√(3²) = 3 và √16 = 4, nên tổng bằng 7."),
  makeQ("seed_quiz_toan9", 3, "Toán", "THCS", "Hàm số y = 2x − 3 có hệ số góc bằng:", ["−3", "3", "2", "1"], [2], "Hàm số y = ax + b có hệ số góc là a, ở đây a = 2."),
  makeQ("seed_quiz_toan9", 4, "Toán", "THCS", "Điểm nào thuộc đồ thị hàm số y = 2x − 3?", ["(0; 3)", "(1; −1)", "(2; 2)", "(−1; 1)"], [1], "Thay x = 1 ta được y = 2·1 − 3 = −1."),
  makeQ("seed_quiz_toan9", 5, "Toán", "THCS", "Hệ phương trình x + y = 5 và x − y = 1 có nghiệm (x; y) là:", ["(2; 3)", "(3; 2)", "(4; 1)", "(1; 4)"], [1], "Cộng hai phương trình được 2x = 6, suy ra x = 3 và y = 2."),

  // Tiếng Anh 9 (DataSeeder.java lines 148-163)
  makeQ("seed_quiz_anh9", 1, "Ngoại ngữ", "THCS", "She ____ to school every day.", ["go", "goes", "going", "gone"], [1], "Chủ ngữ ngôi thứ ba số ít ở thì hiện tại đơn thêm -s/-es: goes."),
  makeQ("seed_quiz_anh9", 2, "Ngoại ngữ", "THCS", "If it rains tomorrow, we ____ at home.", ["stay", "stayed", "will stay", "would stay"], [2], "Câu điều kiện loại 1: If + hiện tại đơn, will + động từ nguyên mẫu."),
  makeQ("seed_quiz_anh9", 3, "Ngoại ngữ", "THCS", "He has lived here ____ 2015.", ["for", "since", "in", "during"], [1], "Dùng since với mốc thời gian, for với khoảng thời gian."),
  makeQ("seed_quiz_anh9", 4, "Ngoại ngữ", "THCS", "English is ____ by millions of people around the world.", ["speaks", "speak", "spoken", "speaking"], [2], "Câu bị động ở hiện tại đơn: is/are + quá khứ phân từ (spoken)."),

  // Toán 12 (DataSeeder.java lines 216-241)
  makeQ("seed_quiz_toan12", 1, "Toán", "THPT", "Đạo hàm của hàm số y = x³ là:", ["x²", "3x²", "3x", "x⁴/4"], [1], "(xⁿ)' = n·xⁿ⁻¹ nên (x³)' = 3x²."),
  makeQ("seed_quiz_toan12", 2, "Toán", "THPT", "Đạo hàm của hàm số y = sin x là:", ["cos x", "−cos x", "−sin x", "tan x"], [0], "(sin x)' = cos x."),
  makeQ("seed_quiz_toan12", 3, "Toán", "THPT", "Nguyên hàm của hàm số f(x) = 2x là:", ["x² + C", "2x² + C", "x + C", "2 + C"], [0], "∫2x dx = x² + C."),
  makeQ("seed_quiz_toan12", 4, "Toán", "THPT", "Giá trị lớn nhất của hàm số y = −x² + 4x trên ℝ là:", ["2", "4", "0", "−4"], [1], "Đỉnh parabol tại x = 2, khi đó y = −4 + 8 = 4."),
  makeQ("seed_quiz_toan12", 5, "Toán", "THPT", "Tích phân của 2x dx từ 0 đến 1 bằng:", ["0", "1", "2", "1/2"], [1], "∫₀¹ 2x dx = [x²]₀¹ = 1."),
  makeQ("seed_quiz_toan12", 6, "Toán", "THPT", "Nghiệm của phương trình 2ˣ = 8 là:", ["2", "3", "4", "6"], [1], "8 = 2³ nên x = 3."),

  // Hóa học 12 (DataSeeder.java lines 285-302)
  makeQ("seed_quiz_hoa12", 1, "Hóa học", "THPT", "Công thức phân tử của glucozơ là:", ["C₆H₁₂O₆", "C₁₂H₂₂O₁₁", "(C₆H₁₀O₅)n", "C₂H₅OH"], [0], "Glucozơ có công thức C₆H₁₂O₆."),
  makeQ("seed_quiz_hoa12", 2, "Hóa học", "THPT", "Este có tên etyl axetat có công thức là:", ["CH₃COOC₂H₅", "C₂H₅COOCH₃", "CH₃COOH", "HCOOC₂H₅"], [0], "Gốc axit axetic (CH₃COO–) gắn với gốc etyl (–C₂H₅)."),
  makeQ("seed_quiz_hoa12", 3, "Hóa học", "THPT", "Phản ứng thủy phân este trong môi trường kiềm được gọi là phản ứng:", ["este hóa", "xà phòng hóa", "trùng hợp", "trùng ngưng"], [1], "Thủy phân este trong kiềm gọi là phản ứng xà phòng hóa."),
  makeQ("seed_quiz_hoa12", 4, "Hóa học", "THPT", "Chất nào sau đây là đisaccarit?", ["glucozơ", "fructozơ", "saccarozơ", "tinh bột"], [2], "Saccarozơ là đisaccarit; glucozơ và fructozơ là monosaccarit."),
  makeQ("seed_quiz_hoa12", 5, "Hóa học", "THPT", "Kim loại có tính dẫn điện tốt nhất ở nhiệt độ thường là:", ["Cu", "Au", "Al", "Ag"], [3], "Bạc dẫn điện tốt nhất, sau đó là đồng."),

  // Nhập môn lập trình (DataSeeder.java lines 352-376)
  makeQ("seed_quiz_laptrinh", 1, "Lập trình", "UNIVERSITY", "Trong lập trình, biến dùng để:", ["lưu trữ dữ liệu trong bộ nhớ", "vẽ giao diện", "kết nối mạng", "biên dịch mã"], [0], "Biến là vùng nhớ có tên dùng để lưu trữ dữ liệu."),
  makeQ("seed_quiz_laptrinh", 2, "Lập trình", "UNIVERSITY", "Kết quả của biểu thức 7 % 3 trong Java, C và Python là:", ["2", "1", "2,33", "0"], [1], "Toán tử % lấy phần dư: 7 chia 3 dư 1."),
  makeQ("seed_quiz_laptrinh", 3, "Lập trình", "UNIVERSITY", "Vòng lặp nào luôn thực hiện thân vòng lặp ít nhất một lần?", ["for", "while", "do...while", "foreach"], [2], "do...while kiểm tra điều kiện sau khi chạy thân vòng lặp."),
  makeQ("seed_quiz_laptrinh", 4, "Lập trình", "UNIVERSITY", "Cấu trúc dữ liệu nào hoạt động theo nguyên tắc vào sau ra trước (LIFO)?", ["hàng đợi", "ngăn xếp", "danh sách liên kết đôi", "cây nhị phân"], [1], "Ngăn xếp (stack) là LIFO; hàng đợi (queue) là FIFO."),
  makeQ("seed_quiz_laptrinh", 5, "Lập trình", "UNIVERSITY", "Thuật toán sắp xếp nào có độ phức tạp trung bình O(n log n)?", ["bubble sort", "insertion sort", "merge sort", "selection sort"], [2], "Merge sort là O(n log n); bubble, insertion và selection sort là O(n²)."),

  // Cơ sở dữ liệu (DataSeeder.java lines 388-413)
  makeQ("seed_quiz_csdl", 1, "Lập trình", "UNIVERSITY", "SQL là viết tắt của:", ["Structured Query Language", "Simple Question Language", "Standard Query Logic", "Sequential Query List"], [0], "SQL: Structured Query Language."),
  makeQ("seed_quiz_csdl", 2, "Lập trình", "UNIVERSITY", "Câu lệnh nào dùng để lấy dữ liệu từ bảng?", ["INSERT", "UPDATE", "SELECT", "DELETE"], [2], "SELECT truy vấn dữ liệu; INSERT thêm, UPDATE sửa, DELETE xóa."),
  makeQ("seed_quiz_csdl", 3, "Lập trình", "UNIVERSITY", "Khóa chính (primary key) có đặc điểm:", ["có thể trùng và có thể NULL", "duy nhất và không được NULL", "chỉ là kiểu chuỗi", "luôn gồm nhiều cột"], [1], "Khóa chính xác định duy nhất một dòng, không trùng và không NULL."),
  makeQ("seed_quiz_csdl", 4, "Lập trình", "UNIVERSITY", "Mệnh đề nào dùng để lọc các dòng theo điều kiện?", ["ORDER BY", "WHERE", "JOIN", "LIMIT"], [1], "WHERE lọc dòng theo điều kiện; ORDER BY dùng để sắp xếp."),
  makeQ("seed_quiz_csdl", 5, "Lập trình", "UNIVERSITY", "Trong tính chất ACID của giao dịch, chữ A là viết tắt của:", ["Atomicity", "Accuracy", "Availability", "Authority"], [0], "ACID gồm Atomicity, Consistency, Isolation, Durability."),
];
