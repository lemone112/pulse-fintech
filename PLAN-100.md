# PULSE — План на 100 шагов

## Фаза 1: Очистка и фундамент (Шаги 1–25)
### Технический долг + мусор

| # | Задача | Приоритет | Статус |
|---|--------|-----------|--------|
| 1 | Удалить мёртвый tailwind.config.ts (TW3 конфиг, игнорируется TW4) | 🔴 | ⬜ |
| 2 | Удалить 45 неиспользуемых shadcn/ui компонентов из src/components/ui/ | 🔴 | ⬜ |
| 3 | Удалить мёртвый mini-services/pulse-service (указывает на несуществующий путь) | 🟡 | ⬜ |
| 4 | Удалить мёртвый pulse/.next/ (build artefacts в git) | 🟡 | ⬜ |
| 5 | Удалить pulse/ директорию целиком (дубликат .next + мусор) | 🟡 | ⬜ |
| 6 | Удалить tailwindcss-animate из package.json (заменён на tw-animate-css) | 🟡 | ⬜ |
| 7 | Удалить @mdxeditor/editor (0 использований, 15+ MB) | 🔴 | ⬜ |
| 8 | Удалить @reactuses/core (0 использований) | 🟡 | ⬜ |
| 9 | Удалить react-syntax-highlighter (0 использований) | 🟡 | ⬜ |
| 10 | Удалить next-intl (0 использований, i18n не реализован) | 🟡 | ⬜ |
| 11 | Удалить uuid (0 использований, есть crypto.randomUUID) | 🟡 | ⬜ |
| 12 | Удалить sharp (0 использований в коде) | 🟡 | ⬜ |
| 13 | Удалить next-auth (0 использований,	auth не реализован — нужна отдельная реализация) | 🟡 | ⬜ |
| 14 | Перенести AI API ключ на сервер (NEXT_PUBLIC_AI_API_KEY → серверный маршрут) | 🔴 | ⬜ |
| 15 | Заменить 9+ дублирующихся `rub()` на единый `formatMoney` из lib | 🔴 | ⬜ |
| 16 | Заменить 16 hex-цветов в categories/page.tsx на CSS-переменные | 🔴 | ⬜ |
| 17 | Объединить `statusToTremorColor()` в constants.ts, убрать дублирование | 🟡 | ⬜ |
| 18 | Убрать ignoreBuildErrors: true из next.config.ts | 🔴 | ⬜ |
| 19 | Добавить .env.example со всеми переменными | 🟡 | ⬜ |
| 20 | Обновить .gitignore: добавить pulse/, agent-ctx/, examples/ | 🟡 | ⬜ |
| 21 | Переименовать пакет с "nextjs_tailwind_shadcn_ts" на "pulse-fintech" | 🟡 | ⬜ |
| 22 | Перенести db.ts в прод-режим: log queries только в dev | 🟡 | ⬜ |
| 23 | Удалить мёртвый api/client.ts (backend на :8080 не существует) | 🟡 | ⬜ |
| 24 | Починить command-palette: добавить router.push() к элементам | 🟡 | ⬜ |
| 25 | Добавитьdark mode subtle-цвета в globals.css | 🟡 | ⬜ |

## Фаза 2: Tremor-First Дизайн-Система (Шаги 26–40)
### Миграция на Tremor Templates как ядро

| # | Задача | Приоритет | Статус |
|---|--------|-----------|--------|
| 26 | Заменить dashboard layout на Tremor SidebarLayout template | 🔴 | ⬜ |
| 27 | Перестроить sidebar на основе Tremor Sidebar template | 🔴 | ⬜ |
| 28 | Заменить все Card обёртки на Tremor Card template (col/span) | 🔴 | ⬜ |
| 29 | Мигрировать dashboard page на Tremor Grid template | 🔴 | ⬜ |
| 30 | Мигрировать KPI карточки на Tremor Metric + DeltaBar template | 🔴 | ⬜ |
| 31 | Заменить inline-бейджи на Tremor Badge/BadgeDelta | 🟡 | ⬜ |
| 32 | Унифицировать таблицы: Tremor Table template вместо custom | 🟡 | ⬜ |
| 33 | Перестроить Tabs на Tremor TabGroup template | 🟡 | ⬜ |
| 34 | Заменить Shadcn TextInput на Tremor TextInput (где возможно) | 🟡 | ⬜ |
| 35 | Создать PulseLayout wrapper (SidebarLayout + breadcrumbs) | 🟡 | ⬜ |
| 36 | Создать PulsePage template (header + content + actions) | 🟡 | ⬜ |
| 37 | Создать PulseTable template (sort + filter + paginate) | 🟡 | ⬜ |
| 38 | Создать PulseForm template (Tremor inputs + validation) | 🟡 | ⬜ |
| 39 | Документировать иерархию: Templates → Components → Tokens → Shadcn | 🟢 | ⬜ |
| 40 | Visual regression test: сверить все страницы после миграции | 🟢 | ⬜ |

## Фаза 3: Prisma Schema + Data Layer (Шаги 41–55)
### Финтех-домен вместо User+Post

| # | Задача | Приоритет | Статус |
|---|--------|-----------|--------|
| 41 | Спроектировать Prisma schema: Organization, Account, Transaction | 🔴 | ⬜ |
| 42 | Добавить модели: Counterparty, Invoice, Document | 🔴 | ⬜ |
| 43 | Добавить модели: Category, Rule, Project, BudgetItem | 🔴 | ⬜ |
| 44 | Добавить модели: Approval, ApprovalStep, AuditLog | 🔴 | ⬜ |
| 45 | Добавить модели: ReportConfig, DashboardWidget | 🟡 | ⬜ |
| 46 | Переключить Prisma на PostgreSQL + pgvector | 🔴 | ⬜ |
| 47 | Создать seed script с реалистичными демо-данными | 🟡 | ⬜ |
| 48 | Создать API routes: /api/transactions (CRUD + фильтры) | 🔴 | ⬜ |
| 49 | Создать API routes: /api/invoices (CRUD + статус-машина) | 🔴 | ⬜ |
| 50 | Создать API routes: /api/counterparties, /api/categories | 🔴 | ⬜ |
| 51 | Создать API routes: /api/reports/pnl, cashflow, balance, trial | 🔴 | ⬜ |
| 52 | Создать API routes: /api/projects, /api/approvals, /api/rules | 🟡 | ⬜ |
| 53 | Создать API route: /api/ai/chat (прокси, скрывающий API key) | 🔴 | ⬜ |
| 54 | Подключить React Query: хуки useTransactions, useInvoices и т.д. | 🔴 | ⬜ |
| 55 | Заменить все hardcoded данные на React Query хуки | 🔴 | ⬜ |

## Фаза 4: Аутентификация и безопасность (Шаги 56–65)

| # | Задача | Приоритет | Статус |
|---|--------|-----------|--------|
| 56 | Настроить NextAuth.js с мультипровайдерами (Google, email, SAML) | 🔴 | ⬜ |
| 57 | Создать middleware для защиты dashboard маршрутов | 🔴 | ⬜ |
| 58 | Добавить модель User + Session + OrganizationMember в Prisma | 🔴 | ⬜ |
| 59 | Создать RBAC: Owner, Admin, Accountant, Viewer | 🟡 | ⬜ |
| 60 | Реализовать role-based навигацию в Sidebar | 🟡 | ⬜ |
| 61 | Создать страницу /login и /register | 🔴 | ⬜ |
| 62 | Добавить CSRF protection для API routes | 🟡 | ⬜ |
| 63 | Добавить rate limiting для API endpoints | 🟡 | ⬜ |
| 64 | Создать AuditLog middleware (кто что делал) | 🟡 | ⬜ |
| 65 | Добавить 2FA опцию для аккаунтов | 🟢 | ⬜ |

## Фаза 5: Бизнес-логика и интеграции (Шаги 66–80)

| # | Задача | Приоритет | Статус |
|---|--------|-----------|--------|
| 66 | Реализовать статус-машину для Invoice (draft→sent→paid→overdue) | 🔴 | ⬜ |
| 67 | Реализовать Approval workflow (многошаговое согласование) | 🔴 | ⬜ |
| 68 | Создать Rule engine (авто-категоризация транзакций) | 🟡 | ⬜ |
| 69 | Создать банковскую абстракцию: BankingProvider interface | 🔴 | ⬜ |
| 70 | Интегрировать топ-3 банковских API (Сбербанк, Тинькофф, ВТБ) | 🟡 | ⬜ |
| 71 | Создать ЭЦП мультипровайдерную абстракцию (топ-10 провайдеров) | 🔴 | ⬜ |
| 72 | Реализовать ЭДО бесшовную интеграцию (Диадок, СБИС) | 🟡 | ⬜ |
| 73 | Настроить Kafka event bus (транзакционные события) | 🔴 | ⬜ |
| 74 | Создать AI Gateway (собственный шлюз, 3-4 класса моделей) | 🔴 | ⬜ |
| 75 | Расширить AI чат: MCP tools для запроса финансовых данных | 🟡 | ⬜ |
| 76 | Добавить AI summary: автоматическая сводка по отчётам | 🟡 | ⬜ |
| 77 | Создать notification system (email + push + in-app) | 🟡 | ⬜ |
| 78 | Реализовать экспорт отчётов: PDF, Excel, CSV | 🟡 | ⬜ |
| 79 | Создать Planning/Budget module (годовой бюджет + план-факт) | 🟡 | ⬜ |
| 80 | Реализовать multi-org переключение | 🟢 | ⬜ |

## Фаза 6: CRDT + Local-First + Офлайн (Шаги 81–90)

| # | Задача | Приоритет | Статус |
|---|--------|-----------|--------|
| 81 | Спроектировать CRDT структуры для транзакций | 🔴 | ⬜ |
| 82 | Реализовать Yjs-based document sync | 🔴 | ⬜ |
| 83 | Создать IndexedDB persistence layer | 🔴 | ⬜ |
| 84 | Реализовать offline-first транзакционный ввод | 🟡 | ⬜ |
| 85 | Создать sync engine: conflict resolution (не last-write-wins) | 🔴 | ⬜ |
| 86 | Добавить optimistic UI updates через CRDT | 🟡 | ⬜ |
| 87 | Реализовать background sync при восстановлении связи | 🟡 | ⬜ |
| 88 | Создать sync status indicator в UI | 🟡 | ⬜ |
| 89 | Добавить Undo/Redo через CRDT history | 🟢 | ⬜ |
| 90 | Нагрузочное тестирование sync engine | 🟢 | ⬜ |

## Фаза 7: UX, качество и продакшен (Шаги 91–100)

| # | Задача | Приоритет | Статус |
|---|--------|-----------|--------|
| 91 | Добавить Skeleton loading для всех страниц | 🔴 | ⬜ |
| 92 | Добавить Error boundaries с informative fallback | 🔴 | ⬜ |
| 93 | Реализовать keyboard shortcuts (Cmd+K, Cmd+N, Cmd+T и т.д.) | 🟡 | ⬜ |
| 94 | Добавить onboarding tour для новых пользователей | 🟢 | ⬜ |
| 95 | Оптимизировать bundle size: dynamic imports для тяжёлых компонентов | 🟡 | ⬜ |
| 96 | Настроить CI/CD: lint → type-check → test → build → deploy | 🔴 | ⬜ |
| 97 | Добавить E2E тесты (Playwright) для критических потоков | 🟡 | ⬜ |
| 98 | Добавить unit тесты для format-утилит и business logic | 🟡 | ⬜ |
| 99 | Настроить monitoring: Sentry для ошибок, Vercel Analytics | 🟢 | ⬜ |
| 100 | Финальный аудит: Lighthouse score ≥ 90, accessibility ≥ AA | 🟢 | ⬜ |
