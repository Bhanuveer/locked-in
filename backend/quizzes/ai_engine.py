"""
AI engine for auto-generated MCQ quizzes.

If GROQ_API_KEY is set, questions are generated via Groq's Llama 3.3 70B in
JSON mode. Otherwise falls back to a mock generator so quiz generation is
demoable without any API key.
"""
import json
import random

from django.conf import settings


def _use_real_ai():
    return bool(settings.GROQ_API_KEY)


def generate_mcq_quiz(subject: str, topics: list[str], num_questions: int = 15):
    """Returns a list of dicts: {question, option_a..option_d, correct_option}."""
    num_questions = max(5, min(num_questions, 20))
    if _use_real_ai():
        try:
            return _generate_mcq_quiz_groq(subject, topics, num_questions)
        except Exception:
            return _generate_mcq_quiz_mock(subject, topics, num_questions)
    return _generate_mcq_quiz_mock(subject, topics, num_questions)


def _generate_mcq_quiz_mock(subject: str, topics: list[str], num_questions: int):
    questions = []
    for i in range(num_questions):
        topic = topics[i % len(topics)] if topics else subject
        questions.append(
            {
                'question': f'Which statement best relates to "{topic}" in {subject}? (mock question {i + 1})',
                'option_a': f'A core idea from {topic}',
                'option_b': 'An unrelated random fact',
                'option_c': 'A common misconception',
                'option_d': 'None of the above',
                'correct_option': 'A',
            }
        )
    random.shuffle(questions)
    return questions


def _generate_mcq_quiz_groq(subject: str, topics: list[str], num_questions: int):
    from groq import Groq

    client = Groq(api_key=settings.GROQ_API_KEY)
    topics_text = ', '.join(topics) if topics else subject
    completion = client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        messages=[
            {
                'role': 'system',
                'content': (
                    'You write multiple-choice quiz questions for school students based only on the '
                    'topics given. Respond with strict JSON only, no markdown, matching exactly this shape: '
                    '{"questions": [{"question": "...", "option_a": "...", "option_b": "...", '
                    '"option_c": "...", "option_d": "...", "correct_option": "A"}]}. '
                    '"correct_option" must be one of "A", "B", "C", "D".'
                ),
            },
            {
                'role': 'user',
                'content': (
                    f'Subject: {subject}\nTopics covered: {topics_text}\n'
                    f'Generate exactly {num_questions} multiple-choice questions covering these topics.'
                ),
            },
        ],
        temperature=0.6,
        max_tokens=4000,
        response_format={'type': 'json_object'},
    )
    data = json.loads(completion.choices[0].message.content)
    questions = data.get('questions', [])[:num_questions]
    for q in questions:
        q['correct_option'] = q.get('correct_option', 'A').strip().upper()[:1]
    return questions
