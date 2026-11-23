package project.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/*
 Môn học có thể thuộc nhiều cấp độ (Education level). Toán 12 và toán 11. Và lập lại toán 11 thì lỗi => UniqueConstranst
*/

@Entity
@Getter
@Setter
@Table(name = "subjects",
       uniqueConstraints = @UniqueConstraint(columnNames = {"name", "education_level_id"}) 
    )
@NoArgsConstructor
public class Subject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name; 

    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "education_level_id", nullable = false)
    private EducationLevel level;
}
