#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт оптимизации видео-фона для свадебного приглашения.

Перед запуском убедитесь, что установлен ffmpeg:
    sudo apt install ffmpeg      # Ubuntu/Debian
    brew install ffmpeg          # macOS

Использование:
    python optimize_video.py input.mp4

Результат сохраняется в static/video/tulle.mp4

Рекомендуемые параметры исходного видео:
    - Разрешение: 720p (1280x720) или 1080p (1920x1080)
    - Длительность: 10-20 секунд (будет зациклено)
    - Формат: MP4 с кодеком H.264
    - Цвета: нюд, пудра, шампань, кремовые тона
"""

import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "static", "video")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "tulle.mp4")


def optimize(input_path):
    if not os.path.exists(input_path):
        print(f"❌ Файл не найден: {input_path}")
        sys.exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Параметры для лёгкого, быстрого, бесшовного видео
    cmd = [
        "ffmpeg",
        "-y",  # перезаписывать выходной файл
        "-i", input_path,
        # Масштабирование до 720p с сохранением пропорций
        "-vf", "scale='min(1280,iw)':-2:flags=lanczos",
        # Кодек H.264 для совместимости со всеми браузерами
        "-c:v", "libx264",
        # Профиль High, уровень 4.1
        "-profile:v", "high",
        "-level", "4.1",
        # Постоянный rate factor: 23 — хороший баланс качество/размер
        # Для ещё меньшего размера можно поставить 26-28
        "-crf", "24",
        # Прессет: slower = лучшее сжатие, но дольше кодирование
        "-preset", "slow",
        # Без звука (видео-фон)
        "-an",
        # Формат MP4 с быстрым стартом (важно для веба)
        "-movflags", "faststart",
        # Pixfmt для совместимости
        "-pix_fmt", "yuv420p",
        # 30 fps — плавно, но не тяжело
        "-r", "30",
        OUTPUT_FILE,
    ]

    print(f"🎬 Оптимизация видео: {input_path}")
    print(f"💾 Результат: {OUTPUT_FILE}")
    print("⏳ Это может занять несколько минут...")

    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        print("❌ Ошибка при обработке видео:")
        print(e.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print("❌ ffmpeg не найден. Установите ffmpeg:")
        print("   Ubuntu/Debian: sudo apt install ffmpeg")
        print("   macOS: brew install ffmpeg")
        sys.exit(1)

    original_size = os.path.getsize(input_path) / (1024 * 1024)
    output_size = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)

    print(f"✅ Готово!")
    print(f"   Исходный размер: {original_size:.2f} Мб")
    print(f"   Оптимизированный: {output_size:.2f} Мб")
    print(f"   Сжатие: {original_size / output_size:.1f}x")
    print(f"\n📌 Теперь поместите файл по пути: static/video/tulle.mp4")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        print(f"\nПример: python optimize_video.py ~/Downloads/tulle.mp4")
        sys.exit(1)
    optimize(sys.argv[1])
