package project.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import project.backend.entity.AttemptAnswer;

public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, Long> { // Jpa want to know the primary
                                                                                      // key
    @Query("""
            select a.attempt.id, count(a.id)
            from AttemptAnswer a
            where a.attempt.id in (:attemptIds)
              and a.answered = true
            group by a.attempt.id
            """)
        
    List<Object[]> countAnswered(@Param("attemptIds") List<Long> attemptIds);
}
