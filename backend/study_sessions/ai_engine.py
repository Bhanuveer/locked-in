"""
AI engine for mid-session comprehension questions.

If GROQ_API_KEY is set (see backend/.env), real questions are generated via
Groq's Llama 3.3 70B. Otherwise this falls back to a mock generator so the
app is fully demoable without any API key.
"""
import json
import random
import re

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


def parse_voice_command(text: str):
    """Parses a spoken command like 'start my Maths session on fractions for 20 minutes'
    into {subject, topic, planned_duration_minutes}. Any field it can't find is empty/None."""
    if _use_real_ai():
        try:
            return _parse_voice_command_groq(text)
        except Exception:
            return _parse_voice_command_mock(text)
    return _parse_voice_command_mock(text)


def _parse_voice_command_mock(text: str):
    duration_match = re.search(r'(\d+)\s*(?:minute|min)', text, re.IGNORECASE)
    topic_match = re.search(r'\bon\s+([a-zA-Z0-9 ]+?)(?:\s+for\s+|$)', text, re.IGNORECASE)
    subject_match = re.search(r'\bmy\s+([a-zA-Z]+)\s+session', text, re.IGNORECASE)
    return {
        'subject': subject_match.group(1).strip().title() if subject_match else '',
        'topic': topic_match.group(1).strip().title() if topic_match else '',
        'planned_duration_minutes': int(duration_match.group(1)) if duration_match else None,
    }


def _parse_voice_command_groq(text: str):
    from groq import Groq

    client = Groq(api_key=settings.GROQ_API_KEY)
    completion = client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        messages=[
            {
                'role': 'system',
                'content': (
                    'Extract study session details from a spoken command. Respond with strict JSON only: '
                    '{"subject": "...", "topic": "...", "planned_duration_minutes": <int or null>}. '
                    'subject is a short school subject name (e.g. "Maths", "Biology"). '
                    'topic is the specific topic within it. If a field is not mentioned, use "" for '
                    'text fields or null for the duration.'
                ),
            },
            {'role': 'user', 'content': text},
        ],
        temperature=0.1,
        max_tokens=150,
        response_format={'type': 'json_object'},
    )
    data = json.loads(completion.choices[0].message.content)
    return {
        'subject': data.get('subject', '') or '',
        'topic': data.get('topic', '') or '',
        'planned_duration_minutes': data.get('planned_duration_minutes'),
    }
