"""
AI engine for mid-session comprehension questions.

If GROQ_API_KEY is set (see backend/.env), real questions are generated via
Groq's Llama 3.3 70B. Otherwise this falls back to a mock generator so the
app is fully demoable without any API key.
"""
import random

from django.conf import settings

MOCK_QUESTION_TEMPLATES = [
    'In your own words, what is the main idea behind "{topic}"?',
    'Can you explain one key concept from "{topic}" that you just studied?',
    'What is one example that illustrates "{topic}"?',
    'Why does "{topic}" matter within {subject}?',
    'What would happen if you applied "{topic}" incorrectly? Give a brief explanation.',
]


def _use_real_ai():
    return bool(settings.GROQ_API_KEY)


def generate_question(subject: str, topic: str) -> str:
    if _use_real_ai():
        return _generate_question_groq(subject, topic)
    template = random.choice(MOCK_QUESTION_TEMPLATES)
    return template.format(topic=topic, subject=subject)


def check_answer(subject: str, topic: str, question_text: str, student_answer: str):
    """Returns (is_correct: bool, feedback: str)."""
    if _use_real_ai():
        return _check_answer_groq(subject, topic, question_text, student_answer)

    answer = student_answer.strip()
    if len(answer) < 8:
        return False, "That answer looks too short to show real understanding — try explaining it in a full sentence."
    return True, "Nice explanation — that shows you're engaging with the material. (mock grading: any answer over ~8 characters passes)"


def _generate_question_groq(subject: str, topic: str) -> str:
    from groq import Groq

    client = Groq(api_key=settings.GROQ_API_KEY)
    completion = client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        messages=[
            {
                'role': 'system',
                'content': 'You write a single short comprehension-check question for a student currently studying a topic. Return only the question, no preamble.',
            },
            {
                'role': 'user',
                'content': f'Subject: {subject}\nTopic: {topic}\nWrite one short question to check the student is actually studying this topic.',
            },
        ],
        temperature=0.7,
        max_tokens=100,
    )
    return completion.choices[0].message.content.strip()


def _check_answer_groq(subject: str, topic: str, question_text: str, student_answer: str):
    from groq import Groq

    client = Groq(api_key=settings.GROQ_API_KEY)
    completion = client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        messages=[
            {
                'role': 'system',
                'content': (
                    'You grade a student answer to a study comprehension question. '
                    'Respond in exactly two lines: '
                    'Line 1 is CORRECT or INCORRECT. Line 2 is one short sentence of feedback.'
                ),
            },
            {
                'role': 'user',
                'content': f'Subject: {subject}\nTopic: {topic}\nQuestion: {question_text}\nStudent answer: {student_answer}',
            },
        ],
        temperature=0.3,
        max_tokens=120,
    )
    text = completion.choices[0].message.content.strip()
    lines = text.splitlines()
    verdict = lines[0].strip().upper() if lines else ''
    feedback = lines[1].strip() if len(lines) > 1 else ''
    return verdict.startswith('CORRECT'), feedback
