package project.backend.config;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import project.backend.entity.EducationLevel;
import project.backend.entity.Question;
import project.backend.entity.QuestionOption;
import project.backend.entity.Quiz;
import project.backend.entity.Subject;
import project.backend.entity.User;
import project.backend.enums.AuthProvider;
import project.backend.enums.Difficulty;
import project.backend.enums.QuestionType;
import project.backend.enums.QuizStatus;
import project.backend.enums.QuizVisibility;
import project.backend.enums.UserRole;

/**
 * Nạp dữ liệu mẫu: 3 cấp học, 10 môn, 10 đề, 100 câu hỏi (kèm đáp án), 3 tài khoản.
 *
 * Bật bằng application.properties:  app.seed.enabled=true
 * Chỉ chạy khi bảng education_level còn trống, nên khởi động lại nhiều lần không bị nhân đôi.
 * Tài khoản mẫu (mật khẩu đều là 123456): giangvien, duy, minhanh
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    @PersistenceContext
    private EntityManager em;

    private final PasswordEncoder passwordEncoder;

    // ---------------------------------------------------------------- khung

    private record Q(String content, QuestionType type, String explanation,
                     List<String> options, Set<Integer> correct) {}

    /** Một đáp án đúng, 4 lựa chọn. correct = 'A'..'D'. */
    private static Q s(String content, char correct, String explanation,
                       String a, String b, String c, String d) {
        return new Q(content, QuestionType.SINGLE_CHOICE, explanation,
                List.of(a, b, c, d), Set.of(correct - 'A'));
    }

    /** Nhiều đáp án đúng. correct = chuỗi chữ cái, ví dụ "AC". */
    private static Q m(String content, String correct, String explanation,
                       String a, String b, String c, String d) {
        Set<Integer> idx = new HashSet<>();
        for (char ch : correct.toCharArray()) {
            idx.add(ch - 'A');
        }
        return new Q(content, QuestionType.MULTIPLE_CHOICE, explanation,
                List.of(a, b, c, d), idx);
    }

    /** Đúng / Sai. */
    private static Q tf(String content, boolean answer, String explanation) {
        return new Q(content, QuestionType.TRUE_FALSE, explanation,
                List.of("Đúng", "Sai"), Set.of(answer ? 0 : 1));
    }

    // ----------------------------------------------------------------- chạy

    @Override
    @Transactional
    public void run(String... args) {
        Long existing = em.createQuery("select count(e) from EducationLevel e", Long.class)
                .getSingleResult();
        if (existing > 0) {
            log.info("DataSeeder: đã có dữ liệu, bỏ qua.");
            return;
        }

        // Tài khoản
        User giangVien = user("giangvien", "giangvien@eduquiz.test", UserRole.LECTURER);
        user("duy", "duy@eduquiz.test", UserRole.USER);
        user("minhanh", "minhanh@eduquiz.test", UserRole.USER);

        // Cấp học (code phải khớp với apiValue bên Flutter: THCS, THPT, UNIVERSITY)
        EducationLevel thcs = level("THCS", "THCS", 1);
        EducationLevel thpt = level("THPT", "THPT", 2);
        EducationLevel dh = level("Đại học", "UNIVERSITY", 3);

        // Môn học
        Subject toan9 = subject("Toán 9", "Toán lớp 9", thcs);
        Subject anh9 = subject("Tiếng Anh 9", "Tiếng Anh lớp 9", thcs);
        Subject ly9 = subject("Vật lí 9", "Vật lí lớp 9", thcs);
        Subject toan12 = subject("Toán 12", "Toán lớp 12", thpt);
        Subject ly12 = subject("Vật lí 12", "Vật lí lớp 12", thpt);
        Subject hoa12 = subject("Hóa học 12", "Hóa học lớp 12", thpt);
        Subject sinh12 = subject("Sinh học 12", "Sinh học lớp 12", thpt);
        Subject lapTrinh = subject("Nhập môn lập trình", "Kiến thức nền tảng về lập trình", dh);
        Subject csdl = subject("Cơ sở dữ liệu", "Cơ sở dữ liệu và SQL", dh);
        Subject mang = subject("Mạng máy tính", "Mạng máy tính căn bản", dh);

        // ============================== THCS ==============================

        addQuiz(toan9, giangVien, "Toán 9: Căn bậc hai và hệ phương trình",
                "Ôn căn bậc hai, hàm số bậc nhất, phương trình bậc hai và lượng giác.",
                s("Căn bậc hai số học của 81 là:", 'A',
                        "√81 = 9 vì 9² = 81 và 9 ≥ 0.",
                        "9", "−9", "81", "3"),
                s("Giá trị của biểu thức √(3²) + √16 bằng:", 'B',
                        "√(3²) = 3 và √16 = 4, nên tổng bằng 7.",
                        "5", "7", "25", "12"),
                s("Hàm số y = 2x − 3 có hệ số góc bằng:", 'C',
                        "Hàm số y = ax + b có hệ số góc là a, ở đây a = 2.",
                        "−3", "3", "2", "1"),
                s("Điểm nào thuộc đồ thị hàm số y = 2x − 3?", 'B',
                        "Thay x = 1 ta được y = 2·1 − 3 = −1.",
                        "(0; 3)", "(1; −1)", "(2; 2)", "(−1; 1)"),
                tf("Phương trình x² − 5x + 6 = 0 có hai nghiệm là 2 và 3.", true,
                        "Tổng hai nghiệm bằng 5 và tích bằng 6 nên hai nghiệm là 2 và 3."),
                s("Biệt thức Δ của phương trình x² − 4x + 3 = 0 bằng:", 'B',
                        "Δ = b² − 4ac = 16 − 12 = 4.",
                        "2", "4", "7", "28"),
                s("Hệ phương trình x + y = 5 và x − y = 1 có nghiệm (x; y) là:", 'B',
                        "Cộng hai phương trình được 2x = 6, suy ra x = 3 và y = 2.",
                        "(2; 3)", "(3; 2)", "(4; 1)", "(1; 4)"),
                s("Trong tam giác vuông, sin của một góc nhọn bằng:", 'B',
                        "sin = cạnh đối / cạnh huyền.",
                        "cạnh kề / cạnh huyền", "cạnh đối / cạnh huyền",
                        "cạnh đối / cạnh kề", "cạnh huyền / cạnh đối"),
                s("Góc nội tiếp chắn nửa đường tròn có số đo bằng:", 'C',
                        "Góc nội tiếp chắn nửa đường tròn là góc vuông.",
                        "45°", "60°", "90°", "180°"),
                m("Chọn các phương trình bậc hai một ẩn:", "AC",
                        "Phương trình bậc hai có dạng ax² + bx + c = 0 với a ≠ 0.",
                        "x² − 2x + 1 = 0", "3x + 1 = 0", "2x² − 5 = 0", "x³ − x = 0"));

        addQuiz(anh9, giangVien, "Tiếng Anh 9: Ngữ pháp trọng tâm",
                "Thì, câu điều kiện, câu bị động, câu hỏi đuôi và từ vựng cơ bản.",
                s("She ____ to school every day.", 'B',
                        "Chủ ngữ ngôi thứ ba số ít ở thì hiện tại đơn thêm -s/-es: goes.",
                        "go", "goes", "going", "gone"),
                s("If it rains tomorrow, we ____ at home.", 'C',
                        "Câu điều kiện loại 1: If + hiện tại đơn, will + động từ nguyên mẫu.",
                        "stay", "stayed", "will stay", "would stay"),
                s("He has lived here ____ 2015.", 'B',
                        "Dùng since với mốc thời gian, for với khoảng thời gian.",
                        "for", "since", "in", "during"),
                s("English is ____ by millions of people around the world.", 'C',
                        "Câu bị động ở hiện tại đơn: is/are + quá khứ phân từ (spoken).",
                        "speaks", "speak", "spoken", "speaking"),
                s("Choose the word that has the OPPOSITE meaning to 'ancient':", 'B',
                        "Ancient nghĩa là cổ xưa, trái nghĩa là modern (hiện đại).",
                        "old", "modern", "historic", "traditional"),
                s("I wish I ____ a bird.", 'C',
                        "Câu ước ở hiện tại dùng quá khứ giả định: I wish I were...",
                        "am", "was", "were", "will be"),
                tf("Câu 'She said that she was tired' là câu tường thuật (reported speech).", true,
                        "Lùi thì và dùng that là dấu hiệu của câu tường thuật."),
                s("Choose the correct question tag: You like coffee, ____?", 'A',
                        "Mệnh đề khẳng định ở hiện tại đơn thì câu hỏi đuôi là phủ định: don't you?",
                        "don't you", "do you", "aren't you", "didn't you"),
                s("He is ____ than his brother.", 'B',
                        "Tính từ ngắn thêm -er trong so sánh hơn: taller.",
                        "tall", "taller", "tallest", "more tall"),
                m("Select all the words that are verbs:", "AC",
                        "Run và write là động từ; happy là tính từ, table là danh từ.",
                        "run", "happy", "write", "table"));

        addQuiz(ly9, giangVien, "Vật lí 9: Điện học và quang học",
                "Định luật Ôm, mạch điện, công suất và khúc xạ ánh sáng.",
                s("Đơn vị đo cường độ dòng điện là:", 'B',
                        "Cường độ dòng điện đo bằng ampe (A).",
                        "Vôn", "Ampe", "Ôm", "Oát"),
                s("Cường độ dòng điện tỉ lệ thuận với hiệu điện thế và tỉ lệ nghịch với:", 'B',
                        "Định luật Ôm: I = U / R.",
                        "công suất", "điện trở", "thời gian", "điện lượng"),
                s("Điện trở 10 Ω đặt vào hiệu điện thế 20 V thì cường độ dòng điện là:", 'B',
                        "I = U / R = 20 / 10 = 2 A.",
                        "0,5 A", "2 A", "10 A", "200 A"),
                s("Hai điện trở 4 Ω và 6 Ω mắc nối tiếp có điện trở tương đương:", 'C',
                        "Mắc nối tiếp: R = R1 + R2 = 10 Ω.",
                        "2,4 Ω", "5 Ω", "10 Ω", "24 Ω"),
                s("Hai điện trở 6 Ω và 3 Ω mắc song song có điện trở tương đương:", 'A',
                        "R = (6·3) / (6+3) = 2 Ω.",
                        "2 Ω", "9 Ω", "3 Ω", "18 Ω"),
                s("Công suất điện được tính bằng công thức:", 'B',
                        "P = U·I.",
                        "P = U / I", "P = U·I", "P = I / U", "P = U + I"),
                tf("Khi tia sáng truyền từ không khí vào nước thì tia khúc xạ lệch lại gần pháp tuyến.", true,
                        "Nước có chiết suất lớn hơn không khí nên góc khúc xạ nhỏ hơn góc tới."),
                s("Thấu kính hội tụ có đặc điểm:", 'B',
                        "Thấu kính hội tụ có phần giữa dày hơn phần rìa.",
                        "phần rìa dày hơn phần giữa", "phần giữa dày hơn phần rìa",
                        "hai mặt đều phẳng", "luôn cho ảnh ảo"),
                s("Ảnh của vật qua gương phẳng là:", 'B',
                        "Gương phẳng cho ảnh ảo, bằng vật và đối xứng với vật qua gương.",
                        "ảnh thật, nhỏ hơn vật", "ảnh ảo, bằng vật",
                        "ảnh thật, bằng vật", "ảnh ảo, lớn hơn vật"),
                m("Chọn các đơn vị đo thuộc điện học:", "AC",
                        "Vôn đo hiệu điện thế, ôm đo điện trở; mét và kilôgam không thuộc điện học.",
                        "Vôn", "Mét", "Ôm", "Kilôgam"));

        // ============================== THPT ==============================

        addQuiz(toan12, giangVien, "Toán 12: Đạo hàm, nguyên hàm, tích phân",
                "Đạo hàm cơ bản, nguyên hàm, tích phân và hàm mũ, logarit.",
                s("Đạo hàm của hàm số y = x³ là:", 'B',
                        "(xⁿ)' = n·xⁿ⁻¹ nên (x³)' = 3x².",
                        "x²", "3x²", "3x", "x⁴/4"),
                s("Đạo hàm của hàm số y = sin x là:", 'A',
                        "(sin x)' = cos x.",
                        "cos x", "−cos x", "−sin x", "tan x"),
                s("Nguyên hàm của hàm số f(x) = 2x là:", 'A',
                        "∫2x dx = x² + C.",
                        "x² + C", "2x² + C", "x + C", "2 + C"),
                s("∫cos x dx bằng:", 'A',
                        "Nguyên hàm của cos x là sin x + C.",
                        "sin x + C", "−sin x + C", "cos x + C", "−cos x + C"),
                s("Giá trị lớn nhất của hàm số y = −x² + 4x trên ℝ là:", 'B',
                        "Đỉnh parabol tại x = 2, khi đó y = −4 + 8 = 4.",
                        "2", "4", "0", "−4"),
                s("Tập xác định của hàm số y = ln x là:", 'B',
                        "Logarit tự nhiên chỉ xác định khi x > 0.",
                        "ℝ", "(0; +∞)", "[0; +∞)", "(−∞; 0)"),
                tf("Hàm số y = eˣ đồng biến trên ℝ.", true,
                        "Đạo hàm y' = eˣ luôn dương nên hàm số đồng biến trên ℝ."),
                s("Tích phân của 2x dx từ 0 đến 1 bằng:", 'B',
                        "∫₀¹ 2x dx = [x²]₀¹ = 1.",
                        "0", "1", "2", "1/2"),
                s("Nghiệm của phương trình 2ˣ = 8 là:", 'B',
                        "8 = 2³ nên x = 3.",
                        "2", "3", "4", "6"),
                m("Chọn các hàm số đồng biến trên ℝ:", "AC",
                        "y = x + 1 và y = x³ đồng biến trên ℝ; y = −x nghịch biến, y = x² không đơn điệu trên ℝ.",
                        "y = x + 1", "y = −x", "y = x³", "y = x²"));

        addQuiz(ly12, giangVien, "Vật lí 12: Dao động và sóng",
                "Dao động điều hòa, con lắc, sóng cơ và dòng điện xoay chiều.",
                s("Trong dao động điều hòa, đại lượng nào KHÔNG đổi theo thời gian?", 'C',
                        "Biên độ là hằng số, còn li độ, vận tốc, gia tốc đều biến thiên.",
                        "li độ", "vận tốc", "biên độ", "gia tốc"),
                s("Chu kì dao động của con lắc đơn chiều dài ℓ tại nơi có gia tốc trọng trường g là:", 'A',
                        "T = 2π√(ℓ/g).",
                        "T = 2π√(ℓ/g)", "T = 2π√(g/ℓ)", "T = (1/2π)√(ℓ/g)", "T = 2πℓ/g"),
                s("Con lắc lò xo gồm vật m và lò xo độ cứng k có tần số góc ω bằng:", 'B',
                        "ω = √(k/m).",
                        "√(m/k)", "√(k/m)", "2π√(k/m)", "k/m"),
                s("Đơn vị của tần số là:", 'C',
                        "Tần số đo bằng héc (Hz).",
                        "giây", "mét", "héc (Hz)", "niutơn"),
                s("Sóng cơ KHÔNG truyền được trong môi trường nào sau đây?", 'D',
                        "Sóng cơ cần môi trường vật chất, không truyền được trong chân không.",
                        "chất rắn", "chất lỏng", "chất khí", "chân không"),
                s("Bước sóng λ, vận tốc truyền sóng v và tần số f liên hệ bởi:", 'B',
                        "λ = v / f.",
                        "λ = v·f", "λ = v / f", "λ = f / v", "λ = v + f"),
                tf("Sóng âm truyền trong không khí là sóng dọc.", true,
                        "Trong chất khí sóng âm là sóng dọc: phần tử dao động dọc theo phương truyền sóng."),
                s("Dòng điện xoay chiều có i = 4cos(100πt) (A) thì tần số của dòng điện là:", 'B',
                        "ω = 100π nên f = ω / 2π = 50 Hz.",
                        "100 Hz", "50 Hz", "4 Hz", "100π Hz"),
                s("Giao thoa sóng xảy ra khi có hai sóng:", 'B',
                        "Hai sóng kết hợp: cùng tần số và độ lệch pha không đổi theo thời gian.",
                        "có cùng biên độ",
                        "cùng tần số và có độ lệch pha không đổi theo thời gian",
                        "truyền ngược chiều nhau", "có bước sóng khác nhau"),
                m("Chọn các phát biểu đúng về dao động điều hòa:", "ABD",
                        "Gia tốc cực đại ở biên, không phải ở vị trí cân bằng; ba phát biểu còn lại đúng.",
                        "Li độ biến thiên theo hàm cos hoặc sin của thời gian",
                        "Vận tốc có độ lớn cực đại khi vật qua vị trí cân bằng",
                        "Gia tốc có độ lớn cực đại ở vị trí cân bằng",
                        "Gia tốc luôn hướng về vị trí cân bằng"));

        addQuiz(hoa12, giangVien, "Hóa học 12: Este, cacbohiđrat, polime",
                "Este, glucozơ, saccarozơ, amin và vật liệu polime.",
                s("Công thức phân tử của glucozơ là:", 'A',
                        "Glucozơ có công thức C₆H₁₂O₆.",
                        "C₆H₁₂O₆", "C₁₂H₂₂O₁₁", "(C₆H₁₀O₅)n", "C₂H₅OH"),
                s("Este có tên etyl axetat có công thức là:", 'A',
                        "Gốc axit axetic (CH₃COO–) gắn với gốc etyl (–C₂H₅).",
                        "CH₃COOC₂H₅", "C₂H₅COOCH₃", "CH₃COOH", "HCOOC₂H₅"),
                s("Phản ứng thủy phân este trong môi trường kiềm được gọi là phản ứng:", 'B',
                        "Thủy phân este trong kiềm gọi là phản ứng xà phòng hóa.",
                        "este hóa", "xà phòng hóa", "trùng hợp", "trùng ngưng"),
                s("Polime nào sau đây được điều chế bằng phản ứng trùng hợp?", 'A',
                        "PVC được trùng hợp từ vinyl clorua; nilon-6,6 và tơ lapsan là trùng ngưng, xenlulozơ là polime thiên nhiên.",
                        "poli(vinyl clorua)", "tơ nilon-6,6", "tơ lapsan", "xenlulozơ"),
                s("Chất nào sau đây là đisaccarit?", 'C',
                        "Saccarozơ là đisaccarit; glucozơ và fructozơ là monosaccarit.",
                        "glucozơ", "fructozơ", "saccarozơ", "tinh bột"),
                s("Kim loại có tính dẫn điện tốt nhất ở nhiệt độ thường là:", 'D',
                        "Bạc dẫn điện tốt nhất, sau đó là đồng.",
                        "Cu", "Au", "Al", "Ag"),
                tf("Tinh bột và xenlulozơ đều là polisaccarit.", true,
                        "Cả hai đều có công thức (C₆H₁₀O₅)n và là polisaccarit."),
                s("Số nguyên tử cacbon trong phân tử glucozơ là:", 'B',
                        "Công thức C₆H₁₂O₆ có 6 nguyên tử C.",
                        "5", "6", "12", "11"),
                s("Chất nào sau đây là amin bậc một?", 'A',
                        "CH₃NH₂ có một gốc hiđrocacbon gắn với nitơ nên là amin bậc một.",
                        "CH₃NH₂", "(CH₃)₂NH", "(CH₃)₃N", "C₂H₅NHCH₃"),
                m("Chọn các chất tham gia phản ứng tráng bạc:", "AC",
                        "Glucozơ và anđehit axetic có nhóm –CHO; saccarozơ và etanol thì không.",
                        "glucozơ", "saccarozơ", "anđehit axetic (CH₃CHO)", "etanol"));

        addQuiz(sinh12, giangVien, "Sinh học 12: Di truyền học",
                "ADN, phiên mã, dịch mã, đột biến và quy luật Menđen.",
                s("Đơn phân cấu tạo nên phân tử ADN là:", 'B',
                        "ADN cấu tạo từ các nuclêôtit.",
                        "axit amin", "nuclêôtit", "glucôzơ", "axit béo"),
                s("Trong phân tử ADN, nuclêôtit loại A liên kết bổ sung với:", 'C',
                        "Nguyên tắc bổ sung: A liên kết với T, G liên kết với X.",
                        "G", "X", "T", "U"),
                s("Quá trình tổng hợp ARN từ mạch khuôn ADN gọi là:", 'C',
                        "Phiên mã là quá trình tổng hợp ARN từ ADN.",
                        "nhân đôi", "dịch mã", "phiên mã", "đột biến"),
                s("Bộ ba mở đầu AUG trên mARN ở sinh vật nhân thực mã hóa axit amin:", 'B',
                        "AUG mã hóa mêtiônin ở sinh vật nhân thực.",
                        "lizin", "mêtiônin", "valin", "prôlin"),
                s("Bộ nhiễm sắc thể lưỡng bội 2n của người bình thường bằng:", 'C',
                        "Người có 46 nhiễm sắc thể (23 cặp).",
                        "23", "44", "46", "48"),
                s("Hội chứng Đao ở người là do đột biến:", 'B',
                        "Người bị Đao có ba nhiễm sắc thể số 21 (thể ba).",
                        "mất một nhiễm sắc thể giới tính X", "thể ba ở cặp nhiễm sắc thể số 21",
                        "thể một ở cặp nhiễm sắc thể số 21", "chuyển đoạn nhiễm sắc thể số 22"),
                tf("Theo quy luật phân li của Menđen, mỗi cặp alen phân li đồng đều về các giao tử.", true,
                        "Đây là nội dung cốt lõi của quy luật phân li."),
                s("Phép lai Aa × Aa (trội hoàn toàn) cho tỉ lệ kiểu hình ở đời con là:", 'B',
                        "Kiểu gen 1AA : 2Aa : 1aa cho kiểu hình 3 trội : 1 lặn.",
                        "1 : 1", "3 : 1", "1 : 2 : 1", "9 : 3 : 3 : 1"),
                s("Đột biến gen là sự biến đổi trong cấu trúc của:", 'B',
                        "Đột biến gen là biến đổi cấu trúc của gen, liên quan tới một hoặc một vài cặp nuclêôtit.",
                        "prôtêin", "gen", "tế bào chất", "ribôxôm"),
                m("Chọn các thành phần tham gia trực tiếp vào quá trình dịch mã:", "ABC",
                        "Dịch mã cần mARN, tARN và ribôxôm; ADN pôlimeraza thuộc quá trình nhân đôi ADN.",
                        "mARN", "tARN", "ribôxôm", "ADN pôlimeraza"));

        // ============================ ĐẠI HỌC =============================

        addQuiz(lapTrinh, giangVien, "Nhập môn lập trình: Kiến thức nền tảng",
                "Biến, vòng lặp, cấu trúc dữ liệu, thuật toán và lập trình hướng đối tượng.",
                s("Trong lập trình, biến dùng để:", 'A',
                        "Biến là vùng nhớ có tên dùng để lưu trữ dữ liệu.",
                        "lưu trữ dữ liệu trong bộ nhớ", "vẽ giao diện",
                        "kết nối mạng", "biên dịch mã"),
                s("Kết quả của biểu thức 7 % 3 trong Java, C và Python là:", 'B',
                        "Toán tử % lấy phần dư: 7 chia 3 dư 1.",
                        "2", "1", "2,33", "0"),
                s("Vòng lặp nào luôn thực hiện thân vòng lặp ít nhất một lần?", 'C',
                        "do...while kiểm tra điều kiện sau khi chạy thân vòng lặp.",
                        "for", "while", "do...while", "foreach"),
                s("Độ phức tạp thời gian của tìm kiếm tuần tự trên mảng n phần tử (trường hợp xấu nhất) là:", 'C',
                        "Có thể phải duyệt hết n phần tử nên là O(n).",
                        "O(1)", "O(log n)", "O(n)", "O(n²)"),
                s("Cấu trúc dữ liệu nào hoạt động theo nguyên tắc vào sau ra trước (LIFO)?", 'B',
                        "Ngăn xếp (stack) là LIFO; hàng đợi (queue) là FIFO.",
                        "hàng đợi", "ngăn xếp", "danh sách liên kết đôi", "cây nhị phân"),
                s("Tìm kiếm nhị phân yêu cầu mảng phải:", 'B',
                        "Tìm kiếm nhị phân chỉ đúng khi mảng đã được sắp xếp.",
                        "có độ dài chẵn", "được sắp xếp",
                        "chỉ chứa số nguyên dương", "không có phần tử trùng"),
                tf("Đệ quy là kỹ thuật trong đó một hàm tự gọi lại chính nó.", true,
                        "Hàm đệ quy cần có điều kiện dừng để không gọi vô hạn."),
                s("Thuật toán sắp xếp nào có độ phức tạp trung bình O(n log n)?", 'C',
                        "Merge sort là O(n log n); bubble, insertion và selection sort là O(n²).",
                        "bubble sort", "insertion sort", "merge sort", "selection sort"),
                s("Tính đóng gói (encapsulation) trong lập trình hướng đối tượng nhằm:", 'A',
                        "Đóng gói che giấu dữ liệu bên trong, chỉ cho truy cập qua phương thức.",
                        "che giấu dữ liệu bên trong đối tượng và chỉ cho truy cập qua phương thức",
                        "cho phép lớp con kế thừa lớp cha",
                        "cho một hàm có nhiều dạng khác nhau", "tăng tốc độ chạy chương trình"),
                m("Chọn các tính chất cơ bản của lập trình hướng đối tượng:", "ABC",
                        "Bốn tính chất thường nêu: đóng gói, kế thừa, đa hình và trừu tượng; biên dịch không phải tính chất OOP.",
                        "đóng gói", "kế thừa", "đa hình", "biên dịch"));

        addQuiz(csdl, giangVien, "Cơ sở dữ liệu: SQL căn bản",
                "Truy vấn SQL, khóa, JOIN, giao dịch và chuẩn hóa.",
                s("SQL là viết tắt của:", 'A',
                        "SQL: Structured Query Language.",
                        "Structured Query Language", "Simple Question Language",
                        "Standard Query Logic", "Sequential Query List"),
                s("Câu lệnh nào dùng để lấy dữ liệu từ bảng?", 'C',
                        "SELECT truy vấn dữ liệu; INSERT thêm, UPDATE sửa, DELETE xóa.",
                        "INSERT", "UPDATE", "SELECT", "DELETE"),
                s("Khóa chính (primary key) có đặc điểm:", 'B',
                        "Khóa chính xác định duy nhất một dòng, không trùng và không NULL.",
                        "có thể trùng và có thể NULL", "duy nhất và không được NULL",
                        "chỉ là kiểu chuỗi", "luôn gồm nhiều cột"),
                s("Khóa ngoại (foreign key) dùng để:", 'B',
                        "Khóa ngoại tạo liên kết giữa dữ liệu của hai bảng.",
                        "mã hóa dữ liệu", "liên kết dữ liệu giữa hai bảng",
                        "sao lưu bảng", "tăng dung lượng lưu trữ"),
                s("Mệnh đề nào dùng để lọc các dòng theo điều kiện?", 'B',
                        "WHERE lọc dòng theo điều kiện; ORDER BY dùng để sắp xếp.",
                        "ORDER BY", "WHERE", "JOIN", "LIMIT"),
                s("Hàm tổng hợp nào dùng để đếm số dòng?", 'C',
                        "COUNT đếm số dòng; SUM tính tổng, AVG tính trung bình, MAX lấy giá trị lớn nhất.",
                        "SUM", "AVG", "COUNT", "MAX"),
                tf("INNER JOIN chỉ trả về các dòng có giá trị khớp ở cả hai bảng.", true,
                        "Các dòng không khớp sẽ bị loại; muốn giữ lại thì dùng LEFT hoặc RIGHT JOIN."),
                s("Trong tính chất ACID của giao dịch, chữ A là viết tắt của:", 'A',
                        "ACID gồm Atomicity, Consistency, Isolation, Durability.",
                        "Atomicity", "Accuracy", "Availability", "Authority"),
                s("Mục đích chính của chuẩn hóa dữ liệu là:", 'A',
                        "Chuẩn hóa giúp giảm dư thừa và tránh bất thường khi cập nhật.",
                        "giảm dư thừa dữ liệu và tránh bất thường khi cập nhật",
                        "tăng số lượng bảng", "mã hóa dữ liệu", "xóa dữ liệu cũ"),
                m("Chọn các hệ quản trị cơ sở dữ liệu quan hệ:", "AB",
                        "MySQL và PostgreSQL là cơ sở dữ liệu quan hệ; MongoDB và Redis là NoSQL.",
                        "MySQL", "PostgreSQL", "MongoDB", "Redis"));

        addQuiz(mang, giangVien, "Mạng máy tính: Kiến thức căn bản",
                "Mô hình OSI, giao thức, địa chỉ IP và các dịch vụ mạng thường gặp.",
                s("Mô hình tham chiếu OSI có bao nhiêu tầng?", 'C',
                        "OSI gồm 7 tầng, từ vật lý đến ứng dụng.",
                        "4", "5", "7", "9"),
                s("Giao thức nào dùng để truyền tải trang web?", 'B',
                        "HTTP (và HTTPS) truyền tải trang web.",
                        "FTP", "HTTP", "SMTP", "SSH"),
                s("Địa chỉ IPv4 gồm bao nhiêu bit?", 'B',
                        "IPv4 dài 32 bit; IPv6 dài 128 bit.",
                        "16", "32", "64", "128"),
                s("Cổng mặc định của giao thức HTTPS là:", 'C',
                        "HTTPS dùng cổng 443; HTTP dùng cổng 80.",
                        "80", "21", "443", "25"),
                s("Giao thức nào chuyển tên miền thành địa chỉ IP?", 'C',
                        "DNS phân giải tên miền thành địa chỉ IP.",
                        "DHCP", "ARP", "DNS", "ICMP"),
                s("Thiết bị nào hoạt động chủ yếu ở tầng mạng để định tuyến gói tin?", 'C',
                        "Bộ định tuyến (router) hoạt động ở tầng 3 và định tuyến gói tin.",
                        "hub", "switch tầng 2", "router", "repeater"),
                tf("TCP đảm bảo truyền dữ liệu tin cậy, còn UDP thì không đảm bảo.", true,
                        "TCP có xác nhận và truyền lại; UDP gửi nhanh nhưng không đảm bảo."),
                s("Địa chỉ nào sau đây là địa chỉ IPv4 riêng (private)?", 'B',
                        "Dải 192.168.0.0/16 là dải địa chỉ riêng.",
                        "8.8.8.8", "192.168.1.10", "172.217.0.1", "1.1.1.1"),
                s("DHCP có chức năng:", 'A',
                        "DHCP tự động cấp phát địa chỉ IP cho các thiết bị trong mạng.",
                        "cấp phát địa chỉ IP tự động cho thiết bị", "mã hóa dữ liệu",
                        "dịch tên miền", "chặn virus"),
                m("Chọn các giao thức thuộc tầng ứng dụng:", "ACD",
                        "HTTP, DNS và FTP thuộc tầng ứng dụng; IP thuộc tầng mạng.",
                        "HTTP", "IP", "DNS", "FTP"));

        log.info("DataSeeder: đã nạp 3 cấp học, 10 môn, 10 đề, 100 câu hỏi, 3 tài khoản.");
    }

    // ------------------------------------------------------------- hỗ trợ

    private User user(String username, String gmail, UserRole role) {
        User u = new User();
        u.setUsername(username);
        u.setGmail(gmail);
        u.setPassword(passwordEncoder.encode("123456"));
        u.setProvider(AuthProvider.LOCAL);
        u.setRole(role);
        em.persist(u);
        return u;
    }

    private EducationLevel level(String name, String code, int order) {
        EducationLevel l = new EducationLevel();
        l.setName(name);
        l.setCode(code);
        l.setOrderIndex(order);
        em.persist(l);
        return l;
    }

    private Subject subject(String name, String description, EducationLevel level) {
        Subject s = new Subject();
        s.setName(name);
        s.setDescription(description);
        s.setLevel(level);
        em.persist(s);
        return s;
    }

    /** Tạo đề + câu hỏi + đáp án. Độ khó: 4 câu đầu EASY, 4 câu giữa MEDIUM, còn lại HARD. */
    private void addQuiz(Subject subject, User owner, String title, String description, Q... qs) {
        Quiz quiz = new Quiz();
        quiz.setTitle(title);
        quiz.setDescription(description);
        quiz.setUser(owner);
        quiz.setSubject(subject);
        quiz.setQuizVisibility(QuizVisibility.PUBLIC);
        quiz.setQuizStatus(QuizStatus.PUBLISHED);
        em.persist(quiz);

        for (int i = 0; i < qs.length; i++) {
            Q q = qs[i];
            Question question = new Question();
            question.setQuiz(quiz);
            question.setContent(q.content());
            question.setType(q.type());
            question.setExplanation(q.explanation());
            question.setDiff(i < 4 ? Difficulty.EASY : (i < 8 ? Difficulty.MEDIUM : Difficulty.HARD));
            question.setOrderIndex(i + 1);

            for (int j = 0; j < q.options().size(); j++) {
                QuestionOption o = new QuestionOption();
                o.setQuestion(question);
                o.setContent(q.options().get(j));
                o.setCorrect(q.correct().contains(j));
                o.setOrderIndex(j + 1);
                question.getOptions().add(o);
            }
            em.persist(question); // cascade ALL nên đáp án được lưu theo
        }
    }
}
