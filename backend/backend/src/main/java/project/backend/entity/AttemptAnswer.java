package project.backend.entity;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "attempt_answer")
public class AttemptAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private QuizAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    // Thứ tự câu này trong lượt làm (sau khi xáo / rút câu)
    @Column(name = "order_index")
    private Integer orderIndex = 0;

    @ManyToMany
    @JoinTable(name = "attempt_answer_options", // Tên bảng sẽ được tạo
    joinColumns = @JoinColumn(name = "attempt_answer_id"), 
    inverseJoinColumns = @JoinColumn(name = "option_id"))
    private Set<QuestionOption> selectedOptions = new HashSet<>(); 
    // Lý do ko dùng set 
    
    @Column(nullable = false)
    private boolean answered = false;
 
    // null = chưa chấm; true/false sau khi nộp bài
    @Column(name = "is_correct")
    private Boolean correct;
 
    // Điểm được ở câu này (null = chưa chấm)
    @Column(name = "earned_score")
    private Double earnedScore;
 
    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    public void select(Set<QuestionOption> options) {
        this.selectedOptions.clear();
        this.selectedOptions.addAll(options);
        this.answered = !options.isEmpty();
        this.answeredAt = LocalDateTime.now();
    }
}
