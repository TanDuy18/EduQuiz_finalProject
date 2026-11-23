package project.backend.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import project.backend.enums.AttemptStatus;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "quiz_attempts")
// Làm đề nào, ai làm, tổng điểm, trạng thái
public class QuizAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(name = "started_at")
    private LocalDateTime startedAt = LocalDateTime.now();
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "correct_count")
    private Integer correctCount;

    @Column(name = "total_count")
    private Integer totalCount;

    private Double score;

    @Column(name = "total_score")
    private Double totalScore;

     // CorrectCount/ totalCount -> làm đúng trên bao nhiêu câu
    @Enumerated(EnumType.STRING)
    private AttemptStatus status = AttemptStatus.IN_PROGRESS;


    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AttemptAnswer> answers = new ArrayList<>(); 


    public void addAnswer(AttemptAnswer a){ // Ai gen nhưng chưa biết làm gì 

    }
}
