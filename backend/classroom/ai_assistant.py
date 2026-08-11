"""
AI homework assistant — answers a student's questions using only the
homework's topic and reference text (what was actually taught), not
general knowledge beyond that scope. Text-only, no audio.
"""
from django.conf import settings

MOCK_REPLY = (
    "(mock assistant — no GROQ_API_KEY set) Based on today's material on \"{topic}\", "
    "try re-reading the reference notes and breaking your question into smaller parts. "
    "Your question was: \"{message}\""
)


def _use_real_ai():
    return bool(settings.GROQ_API_KEY)


def ask_homework_assistant(homework, history, message: str) -> str:
    if _use_real_ai():
        return _ask_groq(homework, history, message)
    return MOCK_REPLY.format(topic=homework.topic, message=message)


def _ask_groq(homework, history, message: str) -> str:
    from groq import Groq

    client = Groq(api_key=settings.GROQ_API_KEY)
    system_prompt = (
        'You are a homework helper for a student. Only use the exact material provided below, '
        'which is what was taught in class today — do not introduce outside concepts or go beyond '
        "this scope, even if you know more about the subject. If the student's question can't be "
        'answered from this material, say so and point them back to the relevant part of it.\n\n'
        f'Homework title: {homework.title}\n'
        f'Topic: {homework.topic}\n'
        f'Reference material: {homework.reference_text or "(no reference text provided)"}'
    )
    messages = [{'role': 'system', 'content': system_prompt}]
    for msg in history:
        role = 'assistant' if msg.role == 'assistant' else 'user'
        messages.append({'role': role, 'content': msg.content})
    messages.append({'role': 'user', 'content': message})

    completion = client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        messages=messages,
        temperature=0.4,
        max_tokens=400,
    )
    return completion.choices[0].message.content.strip()
