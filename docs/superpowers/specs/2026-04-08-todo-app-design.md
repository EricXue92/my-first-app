# Todo App — 设计规范

**日期：** 2026-04-08
**状态：** 已确认

---

## 概述

一个全栈待办清单应用，支持完整 CRUD、JWT 多用户认证、优先级与截止日期管理。用于学习 REST API 设计、状态管理与数据库基本操作。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + Vite + TypeScript |
| 前端状态 | Zustand |
| HTTP 客户端 | Axios |
| 样式 | Tailwind CSS |
| 路由 | React Router v6 |
| 后端框架 | FastAPI (Python) |
| ORM | SQLAlchemy |
| 数据库 | SQLite |
| 数据验证 | Pydantic v2 |
| 认证 | JWT（python-jose）+ bcrypt（passlib） |

---

## 架构

前后端完全分离，通过 HTTP/JSON 通信，CORS 配置允许前端域名访问。

```
React (localhost:5173)  ⟷  FastAPI (localhost:8000)  →  SQLite (todos.db)
```

---

## 项目结构

```
my-first-app/
├── backend/
│   ├── main.py            # FastAPI 应用入口，注册路由、配置 CORS
│   ├── database.py        # SQLAlchemy engine & Session 依赖
│   ├── models.py          # User、Todo ORM 模型
│   ├── schemas.py         # Pydantic 请求/响应 Schema
│   ├── routers/
│   │   ├── auth.py        # 注册、登录、获取当前用户
│   │   └── todos.py       # Todo CRUD 路由
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.ts   # Axios 实例 + 请求拦截器（自动注入 JWT）
    │   ├── components/
    │   │   ├── TodoList.tsx
    │   │   ├── TodoItem.tsx
    │   │   ├── TodoForm.tsx
    │   │   ├── FilterBar.tsx
    │   │   ├── Navbar.tsx
    │   │   └── PrivateRoute.tsx
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   └── TodoPage.tsx
    │   ├── store/
    │   │   ├── authStore.ts   # 用户信息、token、登录/登出 action
    │   │   └── todoStore.ts   # todo 列表、过滤器、CRUD action
    │   ├── types/
    │   │   └── index.ts       # Todo、User、Priority TypeScript 类型
    │   └── main.tsx
    └── package.json
```

---

## 数据模型

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| username | TEXT UNIQUE | 用户名 |
| email | TEXT UNIQUE | 邮箱 |
| hashed_password | TEXT | bcrypt 哈希密码 |
| created_at | DATETIME | 创建时间 |

### todos 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| user_id | INTEGER FK | 关联 users.id |
| title | TEXT NOT NULL | 标题 |
| description | TEXT | 描述（可选） |
| completed | BOOLEAN | 完成状态，默认 false |
| priority | ENUM | low / medium / high，默认 medium |
| due_date | DATE | 截止日期（可选） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 最后更新时间 |

关系：一个用户拥有多个 Todo（1:N），用户只能访问自己的 Todo。

---

## API 设计

所有路由前缀为 `/api`。`/todos` 下所有路由需要 JWT 认证（`Authorization: Bearer <token>`）。

### 认证路由

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册新用户，返回用户信息 | 否 |
| POST | `/api/auth/login` | 登录，返回 access_token | 否 |
| GET | `/api/auth/me` | 获取当前用户信息 | 是 |

### Todo 路由

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/todos` | 获取当前用户所有 Todo，支持 `?completed=` 和 `?priority=` 过滤 | 是 |
| POST | `/api/todos` | 创建新 Todo | 是 |
| GET | `/api/todos/{id}` | 获取单个 Todo | 是 |
| PUT | `/api/todos/{id}` | 更新 Todo（标题/描述/优先级/截止日期） | 是 |
| PATCH | `/api/todos/{id}/toggle` | 切换完成/未完成状态 | 是 |
| DELETE | `/api/todos/{id}` | 删除 Todo | 是 |

所有 404 返回 `{"detail": "Todo not found"}`，权限不符返回 403。

---

## 前端设计

### 页面与路由

| 路径 | 页面 | 访问控制 |
|------|------|------|
| `/login` | 登录页 | 公开 |
| `/register` | 注册页 | 公开 |
| `/` | Todo 主页 | 需登录（PrivateRoute） |

### 状态管理（Zustand）

**authStore：** 持有 `user`、`token`；暴露 `login()`、`logout()` action；token 同步存储至 `localStorage`。

**todoStore：** 持有 `todos` 数组、`filter`（全部/进行中/已完成）、`priorityFilter`；暴露完整 CRUD action，每个 action 调用对应 API 后更新本地状态。

### Axios 拦截器

请求拦截器从 `localStorage` 读取 token，自动附加 `Authorization: Bearer` 头。响应拦截器检测 401，自动清除 token 并跳转 `/login`。

### 主页 UI 要素

- 顶部 Navbar：应用名、当前用户名、退出按钮
- 快速添加栏：文本输入 + 优先级下拉 + 截止日期选择 + 添加按钮
- 过滤栏：全部 / 进行中 / 已完成 + 优先级筛选
- Todo 列表：每条含复选框（切换完成）、标题、截止日期、优先级色标、编辑和删除按钮；已完成项显示删除线
- 底部统计：总数、进行中数量、清除已完成

---

## 认证流程

1. 用户提交用户名+密码 → POST `/api/auth/login`
2. FastAPI 验证密码（bcrypt），签发 JWT（有效期 30 分钟）
3. 前端将 token 存入 `localStorage`，更新 authStore
4. 后续所有请求由 Axios 拦截器自动携带 token
5. PrivateRoute 检测 authStore 中 token，无 token 跳转 `/login`
6. Token 过期时后端返回 401，Axios 响应拦截器清除登录状态并跳转登录页

---

## 错误处理

- 表单校验：前端 Pydantic-style 校验（必填、格式），提交前拦截
- 网络错误：Axios 响应拦截器统一 toast 提示
- 401：自动登出跳转
- 403：提示"无权操作"
- 404：提示"Todo 不存在"
- 422：FastAPI 自动返回字段验证错误，前端展示具体字段提示
