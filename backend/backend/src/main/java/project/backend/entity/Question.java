package project.backend.entity;

import java.util.List;
import java.util.ArrayList;

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
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import project.backend.enums.Difficulty;
import project.backend.enums.QuestionType;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; 

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz; 

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type = QuestionType.SINGLE_CHOICE;

    @Enumerated(EnumType.STRING)
    private Difficulty diff = Difficulty.EASY;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(nullable = false)
    private Double score = 1.0;
    
    @Column(name = "order_index")
    private Integer orderIndex = 0;
    
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    // Cascade.ALL -> Xoá cha xoá con 
    // orphanRemoval -> Xoá đáp án thì xoá khỏi database luôn
    @OrderBy("orderIndex ASC")
    private List<QuestionOption> options = new ArrayList<>();
}
