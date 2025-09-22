# Contributing to Betmate

Thank you for your interest in contributing to Betmate! This guide will help you get started.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Git
- Railway CLI (for deployment)

### Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/your-username/betmate.git
   cd betmate
   ```

2. **Set up the development environment:**
   ```bash
   cd betmate-api
   npm run setup:dev
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.template .env
   # Edit .env with your configuration
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 🌿 Branch Strategy

We use Git Flow with the following branches:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development branches
- `hotfix/*` - Critical bug fixes for production

### Creating Feature Branches

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your feature
# ...

# Push and create PR
git push origin feature/your-feature-name
```

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

### Examples

```bash
git commit -m "feat(auth): add JWT refresh token functionality"
git commit -m "fix(api): resolve database connection timeout issue"
git commit -m "docs: update deployment guide with Railway setup"
git commit -m "test(auth): add unit tests for login endpoint"
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Guidelines

1. **Write tests for new features**
2. **Maintain test coverage above 80%**
3. **Use descriptive test names**
4. **Follow AAA pattern** (Arrange, Act, Assert)

### Test Examples

```typescript
describe('User Authentication', () => {
  it('should return JWT token for valid credentials', async () => {
    // Arrange
    const validCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    // Act
    const response = await request(app)
      .post('/graphql')
      .send({ query: loginMutation, variables: validCredentials });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.data.login.token).toBeDefined();
  });
});
```

## 🔍 Code Quality

### Pre-commit Hooks

We use Husky for pre-commit hooks that run:

- ESLint (linting)
- Prettier (formatting)
- TypeScript type checking
- Tests on affected files

### Manual Code Quality Checks

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format

# Fix formatting
npm run format:fix

# Type check
npm run type-check
```

## 📏 Code Style

### ESLint Configuration

We use TypeScript ESLint with custom rules:

- No unused variables
- Consistent import ordering
- Prefer const over let
- No console.log in production code

### Prettier Configuration

- 2 spaces for indentation
- Single quotes for strings
- Trailing commas where valid
- Semicolons required

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Directories**: `kebab-case`
- **Variables/Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`
- **GraphQL Types**: `PascalCase`

## 🏗️ Architecture Guidelines

### Project Structure

```
betmate-api/
├── src/
│   ├── app.ts              # Express app setup
│   ├── index.ts            # Entry point
│   ├── graphql/            # GraphQL schema & resolvers
│   │   ├── resolvers/      # Resolver functions
│   │   └── schema/         # GraphQL schema files
│   ├── lib/                # Utilities & configuration
│   │   ├── auth.ts         # Authentication logic
│   │   ├── config.ts       # App configuration
│   │   ├── logger.ts       # Logging setup
│   │   └── prisma.ts       # Database client
│   ├── middleware/         # Express middleware
│   └── test/               # Test utilities
├── prisma/                 # Database schema & migrations
├── scripts/                # Deployment & utility scripts
└── dist/                   # Compiled output
```

### GraphQL Guidelines

1. **Schema-first approach**: Define schema before resolvers
2. **Use DataLoader**: For efficient database queries
3. **Error handling**: Use GraphQL errors appropriately
4. **Input validation**: Validate all inputs
5. **Authentication**: Protect sensitive resolvers

### Database Guidelines

1. **Use Prisma**: For type-safe database access
2. **Migrations**: Always create migrations for schema changes
3. **Indexing**: Add indexes for frequently queried fields
4. **Relations**: Use proper foreign key constraints
5. **Soft deletes**: Use soft deletes for important data

## 🔒 Security Guidelines

### Authentication & Authorization

1. **JWT tokens**: Use secure, short-lived tokens
2. **Rate limiting**: Implement for all endpoints
3. **Input validation**: Validate and sanitize all inputs
4. **CORS**: Configure properly for each environment

### Data Protection

1. **Environment variables**: Never commit secrets
2. **Logging**: Redact sensitive information
3. **Database**: Use prepared statements (Prisma handles this)
4. **Headers**: Use security headers (Helmet.js)

## 📖 Documentation

### Code Documentation

1. **JSDoc comments**: For complex functions
2. **README updates**: Keep documentation current
3. **API documentation**: Update GraphQL schema descriptions
4. **Inline comments**: For complex business logic

### GraphQL Schema Documentation

```graphql
"""
User authentication and profile management
"""
type User {
  """Unique identifier for the user"""
  id: ID!

  """User's email address (unique)"""
  email: String!

  """User's display name"""
  name: String!
}
```

## 🚀 Pull Request Process

### Before Creating a PR

1. **Ensure tests pass**: `npm test`
2. **Check code quality**: `npm run lint`
3. **Update documentation**: If needed
4. **Test manually**: Verify functionality
5. **Rebase on develop**: Keep history clean

### PR Requirements

1. **Descriptive title**: Use conventional commit format
2. **Complete description**: Fill out PR template
3. **Link issues**: Reference related issues
4. **Screenshots**: If UI changes
5. **Test coverage**: Maintain or improve coverage

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] Manual testing completed
- [ ] All tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. **Automated checks**: CI must pass
2. **Code review**: At least one approval required
3. **Testing**: Reviewer should test functionality
4. **Security review**: For security-related changes

## 🐛 Bug Reports

### Before Reporting

1. **Search existing issues**: Check if already reported
2. **Reproduce the bug**: Ensure it's reproducible
3. **Gather information**: Logs, environment details
4. **Minimal reproduction**: Create simple test case

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS, Windows, Linux]
- Node.js: [e.g., 18.x]
- Browser: [if applicable]

## Additional Context
Logs, screenshots, etc.
```

## ✨ Feature Requests

### Before Requesting

1. **Check existing requests**: Avoid duplicates
2. **Consider alternatives**: Is there another way?
3. **Think about impact**: Who benefits from this feature?
4. **Provide context**: Why is this needed?

### Feature Request Template

```markdown
## Feature Summary
Brief description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this work?

## Use Cases
- Use case 1
- Use case 2

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2
```

## 🎯 Development Tips

### GraphQL Development

1. **Use GraphQL Playground**: For testing queries
2. **Enable introspection**: In development only
3. **Query complexity**: Monitor and limit complexity
4. **Caching**: Use DataLoader for N+1 queries

### Database Development

1. **Prisma Studio**: For database visualization
2. **Migration workflow**: Always review migrations
3. **Seeding**: Create realistic test data
4. **Performance**: Monitor query performance

### Debugging

1. **Use debugger**: VS Code debugger configuration
2. **Logging**: Use structured logging
3. **Error tracking**: Sentry for production errors
4. **Health checks**: Monitor application health

## 🤝 Community

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the golden rule

### Getting Help

1. **Check documentation**: README, guides, comments
2. **Search issues**: Existing solutions
3. **Ask questions**: Create discussion issues
4. **Join discussions**: Participate in code reviews

### Recognition

Contributors will be recognized in:
- README contributors section
- Release notes
- Project documentation

Thank you for contributing to Betmate! 🚀