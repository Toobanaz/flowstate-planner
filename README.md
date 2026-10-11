# FlowState — Energy-Based Planner

FlowState is a calm, minimal web app that helps you decide what to do based on how you feel right now — instead of forcing your day into a rigid schedule. It asks a simple question each day: **"How are you feeling right now?"** and then plans your tasks around your actual energy and mood.

## How it works

1. **Daily Check-In** — Use the energy slider (1–5, from Exhausted to Energized) and pick a mood (Focused, Overwhelmed, Calm, Anxious, Motivated). You can optionally jot down what's on your mind.
2. **Add your tasks** — Just type them in. FlowState automatically understands what kind of work each task is (Deep Work, Creative, Admin, Social, or Errands) and how much energy it needs.
3. **Plan My Flow** — One click, and FlowState builds a single ordered plan for your day.

## The Flow Plan

Instead of repeating lists, you get one consistent, non-repetitive plan:

- **Do Now** — tasks that match your current energy and the time of day.
- **Later today** — tasks better suited to a later period (morning / afternoon / evening).
- **Tomorrow · After rest** — demanding tasks you shouldn't start late in the day.
- **Set Aside** — tasks to avoid for now, so you don't burn out.

FlowState also suggests a **timeline for your day**, matching high-energy work to your mornings and lighter tasks to the afternoon or evening.

## Key features

- **Energy-aware planning** — every task has an energy requirement; your plan adapts to how drained or charged you feel.
- **Local-time awareness** — the app knows whether it's morning, afternoon, or evening where you are, and never suggests heavy work at night. High-energy tasks late in the day are deferred to tomorrow.
- **Smart prioritization** — feeling overwhelmed? It nudges you toward small admin tasks. Feeling focused? Deep work comes first. Low on energy? It limits suggestions so you're not overwhelmed.
- **AI task understanding** — tasks you type are automatically classified with a tag and energy level; original task names are always kept exactly as you wrote them.
- **✨ Insights** — a weekly look at your check-ins and tasks that returns a few short, encouraging, practical observations about your patterns.
- **Task completion tracking** — check off tasks and the plan instantly replans around what's left.
- **Scheduling preferences** — optionally tell the app when you'd like to do a task (Morning / Afternoon / Evening).

## Accounts & sync

Create an account with email and password, or sign in with Google. Your tasks, daily check-ins, and insights are tied to your account and sync across devices — sign out anytime from the top-right menu.

## Design

FlowState uses a soft, warm, sage-and-cream palette with gentle animations — a calm "luxury journaling" feel rather than a busy productivity dashboard. It's mobile-first, so planning works just as well on your phone.

## Tech

Built with React, TypeScript, and Tailwind CSS on the frontend, with a cloud backend handling accounts, task storage, daily logs, and AI-powered task classification and insights.
