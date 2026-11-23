package project.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import project.backend.entity.QuizAttempt;
import project.backend.enums.AttemptStatus;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long>{

   @EntityGraph(attributePaths = "quiz") 
   List<QuizAttempt> findByUser_IdAndStatusOrderByStartedAtDesc(Long userId, AttemptStatus status);
}
