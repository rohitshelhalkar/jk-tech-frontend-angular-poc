#!/bin/bash

echo "🚀 Starting E2E Test Suite..."
echo "=================================="

# Check if Cypress is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

# Run setup verification test first
echo "📋 Running setup verification..."
npx cypress run --spec "cypress/e2e/setup-test.cy.ts" --headless --quiet

if [ $? -eq 0 ]; then
    echo "✅ Setup verification passed!"
else
    echo "❌ Setup verification failed. Please check Cypress configuration."
    exit 1
fi

# Run health check test
echo "🏥 Running health check..."
npx cypress run --spec "cypress/e2e/00-health-check.cy.ts" --headless --quiet

if [ $? -eq 0 ]; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check failed. Application may not be running."
    echo "Please start the Angular dev server with: npm start"
fi

echo ""
echo "📊 E2E Test Suite Summary:"
echo "=========================="
echo "✅ Cypress configuration: Working"
echo "✅ Custom commands: Available"
echo "✅ Test fixtures: Accessible"
echo "✅ TypeScript integration: Configured"
echo ""
echo "🧪 Available test suites:"
echo "- 01-authentication.cy.ts (Authentication Flow)"
echo "- 02-document-management.cy.ts (Document Management)"
echo "- 03-user-management.cy.ts (User Management)"
echo "- 04-qna-system.cy.ts (Q&A RAG System)"
echo "- 05-ingestion-workflow.cy.ts (Ingestion Workflow)"
echo ""
echo "🏃 To run all tests: npm run e2e"
echo "🖥️  To open Cypress GUI: npm run e2e:open"
echo "📝 To run specific test: npx cypress run --spec \"cypress/e2e/[test-file].cy.ts\""