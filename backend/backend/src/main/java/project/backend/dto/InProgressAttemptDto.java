package project.backend.dto;

import java.time.LocalDateTime;

/** Một bài đang làm dở của người dùng (mục "Tiếp tục học"). */
public record InProgressAttemptDto(
        Long attemptId,
        Long quizId,
        String title,
        int answered,
        int total,
        LocalDateTime startedAt) {
}
