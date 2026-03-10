# 🤝 Contributing to GeoSurvey Platform

First off, **thank you**! 🎉 We are incredibly grateful that you are taking the time to contribute to the Geophysical & Geotechnical Survey Analysis Platform. Your help is what makes open-source communities amazing.

Whether you're fixing a typo, designing a new UI component, or implementing complex numerical solvers in SimPEG, your contributions matter exactly the same.

---

## 🚀 How Can I Contribute?

### 🐛 Reporting Bugs
Notice something broken? Help us fix it!
- Check the **GitHub Issues** to see if it has already been reported.
- If not, open a new Issue using the `bug` label.
- **Please include:** Steps to reproduce the bug, what you expected to happen, what actually happened, and screenshots if applicable!

### ✨ Proposing Features
Got an idea that will make this platform better?
- Open an Issue with the `enhancement` label.
- Describe the use case! Why do geotechnical or geophysical engineers need this?
- If you have an implementation plan in mind, let us know!

### 💻 Contributing Code (Pull Requests)
Ready to write some code? Let's get to it!

1. **Fork the repository** to your own GitHub account.
2. **Clone** your fork locally: `git clone https://github.com/your-username/geophysical-web.git`
3. **Create a branch** for your feature or fix: `git checkout -b feature/amazing-new-chart`
4. **Make your changes**. Write clean, commented code. (See standards below).
5. **Test** your changes locally! Make sure the frontend compiles and the API doesn't crash.
6. **Commit** your changes with clear, descriptive messages.
   - Example: `feat(frontend): add new 3D viewer for gravity data`
   - Example: `fix(backend): correct haversine distance bug in boreholes`
7. **Push** your branch: `git push origin feature/amazing-new-chart`
8. **Submit a Pull Request (PR)** against the `main` branch of this repository!

---

## 🛠️ Development Setup

The easiest way to develop safely without messing up your local machine is utilizing Docker.

```bash
# Clone your fork
git clone https://github.com/your-username/geophysical-web.git
cd geophysical-web

# Fire up the entire stack!
docker-compose up --build
```
> The Frontend hot-reloads on port `3000`. The Backend hot-reloads on port `8000`.

---

## 📏 Code Standards & Guidelines

To keep the platform cohesive and professional, please adhere to our stack standards:

### Backend (Python / FastAPI)
- **Formatting:** We use standard `PEP 8` formatting.
- **Typing:** Use strict Python type hints `(x: int, y: str) -> bool` everywhere.
- **Docs:** Write descriptive docstrings for all new endpoint routers, Pydantic schemas, and mathematical functions.
- Every API endpoint requires a corresponding defined `BaseModel` schema in `app/schemas/`.

### Scientific Engine (Python / SimPEG / pyGIMLi)
- **Isolation:** Never put heavy mathematical computation inside backend routers! 
- All inversions, meshing, and data parsing must reside in `scientific-engine/`. 
- **Stubs:** If you are building the UI for a new method but haven't written the math yet, put a *stub* in `engine/simpeg_runner.py` that waits a few seconds and returns mock data so the platform doesn't crash.

### Frontend (Next.js / React / TypeScript)
- **Language:** Strictly use **TypeScript**, not JavaScript. Define Interfaces for all your component props!
- **Styling:** We use **Tailwind CSS**. Avoid writing inline `.css` files unless absolutely necessary. We stick to a clean, minimal, warm "Claude-like" aesthetic. No crazy neon colors!
- **Visuals:** Use `react-plotly.js` for 2D charts and `leaflet` for maps.

---

## ⚖️ License & Agreement
By contributing to the GeoSurvey Platform, you agree that your contributions will be licensed under its **MIT License**.

Happy coding! 👩‍💻👨‍💻
