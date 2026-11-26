package project.backend.entity;

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
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import project.backend.enums.QuizStatus;
import project.backend.enums.QuizVisibility;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "quizs")
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "thumbnail_URL")
    private String thumbnailURL;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuizVisibility quizVisibility = QuizVisibility.PRIVATE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuizStatus quizStatus = QuizStatus.DRAFT;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 45; // thời gian làm bài (phút)

    @Column(name = "rating_avg")
    private Double ratingAvg = 0.0; // điểm đánh giá trung bình (denormalized)

    @Column(name = "rating_count")
    private Integer ratingCount = 0;

    @Column(name = "play_count")
    private Integer playCount = 0; // số lượt làm

}
