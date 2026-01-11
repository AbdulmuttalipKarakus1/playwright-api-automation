# API Test Automation Framework

A modern API test automation framework built with Playwright and TypeScript, featuring PostgreSQL test logging and Colima-based container management.

> **Note**: This framework uses Colima as the container runtime, which is a lightweight alternative to Docker Desktop for macOS and Linux.

## 🚀 Features

- **Playwright Test Runner**: Powerful and modern test execution engine
- **TypeScript**: Type-safe code development
- **PostgreSQL Logging**: All API test results stored in database
- **Colima Integration**: Lightweight container runtime with automatic database management via Testcontainers
- **Multiple Test Strategies**: Smoke, regression, and custom test groups
- **Detailed Reporting**: HTML test reports and database queries
- **Modular Architecture**: Clean separation of concerns with helpers, models, and services

## 📋 Prerequisites

- Node.js (v16 or higher)
- Colima or Docker (for testcontainers)
- npm or yarn

## 🔧 Installation

1. Install and start Colima (if not already running):
```bash
# Install Colima (macOS)
brew install colima

# Start Colima
colima start

# Verify Colima is running
colima status
```

2. Clone the repository:
```bash
git clone <repository-url>
cd playwright-api-automation
```

3. Install dependencies:
```bash
npm install
```

4. Install Playwright browsers:
```bash
npx playwright install
```

## 🏃 Running Tests

### Run all tests
```bash
npm test
```

### Run smoke tests
```bash
npm run test:smoke
```

### Run regression tests
```bash
npm run test:regression
```

## 📊 Reporting

### Playwright HTML Report

View the comprehensive Playwright HTML report with test results, screenshots, and traces:
```bash
npm run report
```

The Playwright report includes:
- ✅ Test execution summary (passed, failed, skipped)
- ⏱️ Execution time for each test
- 🔍 Detailed test steps and assertions
- 📸 Screenshots on failure
- 🔗 API request/response details
- 📊 Visual timeline of test execution

### Database Logs

View API test logs stored in PostgreSQL:
```bash
npm run db:logs
```

Shows details of the last 20 test runs:
- Test name
- HTTP method (GET, POST, PUT, DELETE)
- Endpoint URL
- Request Header
- Request Body
- Response Header
- Response Body
- Response status code
- Execution time (ms)
- Timestamp

## 🗄️ Database Management

### Connect to PostgreSQL shell
```bash
npm run db:shell
```

### Stop the database
```bash
npm run db:stop
```

### Run manual queries
```bash
npm run db:shell
```
Then execute simple SQL queries:
```sql
SELECT id, test_name, endpoint, response_status FROM api_logs.api_logs ORDER BY created_at DESC LIMIT 10;
```
> **Note**: For complex sql query use database tool instead of terminal for best view.

## 📁 Project Structure

```
playwright-api-automation/
├── src/
│   ├── config/
│   │   ├── database.config.ts      # Database configuration
│   │   ├── global-setup.ts         # Global test setup
│   │   └── global-teardown.ts      # Global test teardown
│   ├── helpers/
│   │   ├── api-client.base.ts      # Base API client
│   │   ├── api-client.factory.ts   # API client factory
│   │   └── auth.client.ts          # Authentication helper
│   ├── models/
│   │   ├── auth.model.ts           # Authentication models
│   │   └── user.model.ts           # User models
│   ├── services/
│   │   ├── database.manager.ts     # Database service
│   │   └── testcontainer.manager.ts # Container management
│   └── tests/
│       ├── array-response.spec.ts   # Array response tests
│       ├── authentication.spec.ts   # Authentication tests
│       └── user-crud.spec.ts        # User CRUD tests
├── test-results/                    # Test execution results
├── playwright-report/               # HTML reports
├── scripts/
│   └── check-docker.sh             # Colima/Docker validation script
├── .env                            # Environment variables
├── playwright.config.ts            # Playwright configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Project dependencies
└── README.md                       # This file
```

## 🏷️ Test Tags

Test tag examples:

- `@smoke`: Fast tests covering critical functionalities
- `@regression`: Comprehensive regression test suite

Using tags in test files:
```typescript
test('@smoke GET /api/users should return 200', async ({ request }) => {
    // test code
});
```

## 🔍 Logging

All API tests are automatically logged to PostgreSQL database:

- Test name
- HTTP method (GET, POST, PUT, DELETE)
- Endpoint URL
- Request Header
- Request Body
- Response Header
- Response Body
- Response status code
- Execution time (ms)
- Timestamp

> **Note**: To enable database logging, KEEP_CONTAINER_RUNNING=true should be in env file. If it is false, the container is automatically cleaned up and logs are not persisted.

## 🐳 Container Runtime (Colima)

The framework uses Colima as the container runtime and automatically checks if it's running before executing tests:

```bash
npm run check:runtime
```

PostgreSQL container is automatically started and managed during tests (using Testcontainers).

### Colima Commands

```bash
# Start Colima
colima start

# Stop Colima
colima stop

# Check Colima status
colima status

# View running containers
docker ps

# Restart Colima (if needed)
colima restart
```

## 🛠️ Configuration

### Environment Variables

Create a `.env` file:
```env
# Example configuration
DATABASE_URL=postgresql://testuser:testpass@localhost:5432/api_test_db
API_BASE_URL=https://api.example.com
```

### Playwright Configuration

Edit `playwright.config.ts` according to your needs.


## 🏗️ Architecture

### Helpers
- **api-client.base.ts**: Base class for API clients with common methods
- **api-client.factory.ts**: Factory pattern for creating API clients
- **auth.client.ts**: Authentication-specific client methods

### Models
- **auth.model.ts**: Authentication request/response models
- **user.model.ts**: User entity models

### Services
- **database.manager.ts**: PostgreSQL database operations
- **testcontainer.manager.ts**: Docker container lifecycle management

### Configuration
- **database.config.ts**: Database connection settings
- **global-setup.ts**: Runs once before all tests
- **global-teardown.ts**: Runs once after all tests

### Best Practices

1. **Test Organization**: Keep tests focused and atomic
2. **Tag Usage**: Use appropriate tags for test categorization
3. **Data Management**: Clean up test data after each test
4. **Error Handling**: Use try-catch blocks for async operations
5. **Assertions**: Use descriptive assertion messages

## 🔗 Useful Links

- [Playwright Documentation](https://playwright.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Testcontainers Documentation](https://testcontainers.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Colima Documentation](https://github.com/abiosoft/colima)
- [DummyJSON API](https://dummyjson.com) - Test API used in this framework

## 📈 Test Coverage

This framework includes tests for:

- ✅ Array response validation
- ✅ Authentication flows
- ✅ User CRUD operations
- ✅ Error handling
- ✅ Response time validation
