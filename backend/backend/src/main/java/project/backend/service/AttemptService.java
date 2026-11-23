package project.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import project.backend.dto.InProgressAttemptDto;
import project.backend.entity.QuizAttempt;
import project.backend.enums.AttemptStatus;
import project.backend.repository.AttemptAnswerRepository;
import project.backend.repository.QuizAttemptRepository;

@RequiredArgsConstructor
@Service
public class AttemptService {

    private static final int MAX_ITEMS = 3;

    private final QuizAttemptRepository quizAttemptRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;

    @Transactional(readOnly = true)
    public List<InProgressAttemptDto> inProgress(Long userId) {
        List<QuizAttempt> allAttempts = quizAttemptRepository.findByUser_IdAndStatusOrderByStartedAtDesc(userId,
                AttemptStatus.IN_PROGRESS);

        if (allAttempts.isEmpty()) {
            return List.of();
        }

        int size = Math.min(allAttempts.size(), MAX_ITEMS);
        List<QuizAttempt> attempts = allAttempts.subList(0, size);

        List<Long> attemptIds = new ArrayList<>();
        for (QuizAttempt attempt : attempts) {
            attemptIds.add(attempt.getId());
        }
        Map<Long, Integer> answeredCounts = countAnswered(attemptIds);

        List<InProgressAttemptDto> result = new ArrayList<>();
        for (QuizAttempt attempt : attempts) {
            result.add(toDto(attempt, answeredCounts));
        }
        return result;
    }

    private Map<Long, Integer> countAnswered(List<Long> attemptIds) {
        Map<Long, Integer> counts = new HashMap<>();

        List<Object[]> rows = attemptAnswerRepository.countAnswered(attemptIds);
        for (Object[] row : rows) {
            Long attemptId = (Long) row[0]; // cột 1: id bài làm
            int answered = ((Number) row[1]).intValue(); // cột 2: số câu đã trả lời
            counts.put(attemptId, answered);
        }
        return counts;
    }

    private InProgressAttemptDto toDto(QuizAttempt attempt, Map<Long, Integer> answeredCounts) {
        // Không có trong bảng tra nghĩa là chưa trả lời câu nào, nên lấy 0
        int answered = answeredCounts.getOrDefault(attempt.getId(), 0);

        int total = 0;
        if (attempt.getTotalCount() != null) {
            total = attempt.getTotalCount();
        }

        return new InProgressAttemptDto(
                attempt.getId(),
                attempt.getQuiz().getId(),
                attempt.getQuiz().getTitle(),
                answered,
                total,
                attempt.getStartedAt());
    }
}
