# Bookify - Appointment Management System

Bookify is a high-performance orchestration platform for managing complex appointment workflows. It integrates a Google Gemini-powered AI agent with a robust microservices architecture to provide automated scheduling, secure financial transactions, and intelligent resource allocation.

## Demo
[View Project Demo](https://drive.google.com/drive/folders/12F4OqzzMWNK6XssJGiCj2tD7kLKcDolx?usp=sharing)

## Core Capabilities

- AI-Driven Scheduling: A multi-turn conversational agent that manages service discovery, availability checks, and booking finalization.
- Dynamic Resource Allocation: Flexible management of staff, rooms, and assets with service-specific working hours and capacity constraints.
- Financial Integrity: Hardened payment verification flow using Razorpay with server-side signature validation and atomic state transitions.
- Cross-Channel Notifications: Asynchronous delivery of booking confirmations and updates via Email and SMS (Twilio).
- Persona-Based Access: Strict Role-Based Access Control (RBAC) for Admins, Organisers, and Customers.

## Architecture and Infrastructure

Bookify is built on a decoupled microservices topology, ensuring high availability and independent scalability of critical components.

### System Components
- Core API (Django & DRF): Handles the business logic layer, identity management, and orchestration of transactional workflows.
- Client Interface (React & Vite): A high-fidelity, responsive frontend optimized for performance and streamlined user experience.
- Background Processing (Celery): Offloads long-running and scheduled tasks to dedicated workers, maintaining API responsiveness.
- Database (PostgreSQL): The reliable source of truth, utilizing advanced relational features for data integrity.

### Messaging and Observability
The system employs a sophisticated messaging stack to coordinate asynchronous operations:
- RabbitMQ: Serves as the high-throughput message broker, providing reliable task distribution and queue management.
- Redis: Utilized as a high-speed result backend and transient cache to reduce primary database load.
- Flower: Provides real-time observability into the health and performance of the Celery worker pool and mission-critical task execution.

## Engineering for Real-World Scalability

The system architecture incorporates several design patterns targeted at high-load production environments.

### Hybrid Identifier Strategy
Bookify utilizes a context-aware ID strategy to balance security and database performance:
- UUIDv4: Employed for public-facing entities (Users, Bookings, Payments). This eliminates ID enumeration risks and facilitates safe data distribution across environments.
- Big Integers: Used for internal, high-cardinality links (Services, Slots). This optimizes B-tree indexing efficiency, reduces memory consumption, and speeds up complex relational joins.

### Performance-First Indexing
Data retrieval is optimized through strategic indexing patterns:
- Composite Indices: Multi-field indices on `(user, purpose, is_used)` and `(service, day_of_week)` reduce query complexity for frequent filters.
- Partial/Conditional Indices: Specialized indices like `active_slots_idx` target only active datasets, minimizing write overhead and storage footprint.
- Time-Series Optimization: Indices on `expires_at` and `created_at` enable efficient purging of ephemeral data (OTPs) and performant historical reporting.

## Technical Tech Stack

- Backend: Django, Django REST Framework, Celery, PostgreSQL, SimpleJWT.
- Frontend: React, Redux Toolkit, Mantine UI, Tailwind CSS, Framer Motion.
- Messaging/Cache: RabbitMQ, Redis.
- AI/External: Google Gemini API, Razorpay, Twilio.

## Developer Guide

### Prerequisites
- Docker and Docker Compose (v2.x+).
- Secure environment secrets configured in `backend_django/.env` and `frontend/.env`.

### Local Development Setup
1. Clone the repository and navigate to the project root.
2. Configure environment variables using the provided `.env.example` templates.
3. Build and launch the containerized environment:
   ```bash
   docker-compose up --build -d
   ```

### Internal Service Endpoints
- Application Frontend: http://localhost:5173
- API Gateway: http://localhost:8000
- Task Monitoring (Flower): http://localhost:5555
- RabbitMQ Management: http://localhost:15672

## Maintenance and Observability
Standard maintenance involves monitoring task throughput via Flower and ensuring queue health through the RabbitMQ management console. Database migrations and static asset collection are handled automatically within the container startup sequence to ensure environment consistency.
