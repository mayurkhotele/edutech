# Battle Quiz System - Testing Guide

## 🚀 Quick Start Testing

### 1. **Backend Setup**
```bash
# Install dependencies
npm install socket.io jsonwebtoken mysql2 cors dotenv

# Set up environment variables in .env
BATTLE_QUESTION_TIME_LIMIT=10
BATTLE_QUESTIONS_PER_ROUND=5
BATTLE_MAX_PLAYERS=2
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
JWT_SECRET=your_jwt_secret

# Start server
npm start
```

### 2. **Database Setup**
```sql
-- Create battle tables
CREATE TABLE battle_rooms (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status ENUM('waiting', 'active', 'completed') DEFAULT 'waiting',
    max_players INT DEFAULT 2,
    current_players INT DEFAULT 0,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add sample questions
INSERT INTO questions (question_text, options, correct_answer, category) VALUES
('What is the capital of France?', '["London", "Berlin", "Paris", "Madrid"]', 2, 'battle'),
('Which planet is closest to the Sun?', '["Venus", "Mercury", "Earth", "Mars"]', 1, 'battle'),
('What is 2 + 2?', '["3", "4", "5", "6"]', 1, 'battle'),
('Who wrote Romeo and Juliet?', '["Shakespeare", "Dickens", "Austen", "Tolstoy"]', 0, 'battle'),
('What is the largest ocean?', '["Atlantic", "Indian", "Arctic", "Pacific"]', 3, 'battle');
```

## 🧪 Testing Methods

### Method 1: Automated Testing (Node.js)
```bash
# Install test dependencies
npm install socket.io-client jsonwebtoken

# Run automated tests
node test-battle.js
```

### Method 2: Manual Testing (Browser)
1. Open `test-battle.html` in your browser
2. Click "Connect" to establish WebSocket connection
3. Create a room and test the full battle flow

### Method 3: React Native App Testing
1. Open your React Native app
2. Navigate to the Battle Room screen
3. Test with multiple devices/simulators

## 📋 Test Scenarios

### Scenario 1: Basic Connection Test
- [ ] Server starts without errors
- [ ] WebSocket connection established
- [ ] Authentication works with valid token
- [ ] Connection status updates correctly

### Scenario 2: Room Management Test
- [ ] Create battle room successfully
- [ ] Room appears in available rooms list
- [ ] Join existing room
- [ ] Leave room
- [ ] Room status updates correctly

### Scenario 3: Player Management Test
- [ ] Player joins room
- [ ] Player ready status updates
- [ ] Both players ready triggers battle start
- [ ] Player disconnection handled properly

### Scenario 4: Battle Flow Test
- [ ] Battle starts with 5 questions
- [ ] Questions display correctly
- [ ] Timer counts down from 10 seconds
- [ ] Answer submission works
- [ ] Scores calculate correctly
- [ ] Battle ends with results

### Scenario 5: Multiplayer Test
- [ ] Two players can join same room
- [ ] Real-time updates work for both players
- [ ] Synchronized question display
- [ ] Both players can answer questions
- [ ] Results show for both players

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Connection Failed
```
Error: Connection failed
```
**Solution:**
- Check if server is running on correct port
- Verify CORS settings
- Check firewall settings

#### 2. Authentication Error
```
Error: Authentication error
```
**Solution:**
- Verify JWT_SECRET in .env
- Check token format in frontend
- Ensure user exists in database

#### 3. Database Connection Error
```
Error: Database connection failed
```
**Solution:**
- Check database credentials
- Ensure database is running
- Verify table structure

#### 4. Questions Not Loading
```
Error: No questions available
```
**Solution:**
- Add questions to database
- Check category filter
- Verify question format

#### 5. Timer Issues
```
Error: Timer not working
```
**Solution:**
- Check WebSocket event handling
- Verify time_update events
- Check client-side timer logic

## 📊 Performance Testing

### Load Testing
```bash
# Test with multiple concurrent users
for i in {1..10}; do
  node test-battle.js &
done
```

### Memory Usage
```bash
# Monitor memory usage
node --inspect test-battle.js
```

### Response Time
- Room creation: < 100ms
- Question loading: < 200ms
- Answer submission: < 50ms
- Real-time updates: < 100ms

## 🐛 Debug Mode

Enable debug logging in your backend:

```javascript
// In your socket/battleSocket.js
const DEBUG = true;

function debugLog(message, data = null) {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
}

// Use throughout your code
debugLog('Player joined room', { playerId, roomId });
```

## 📱 Mobile Testing

### React Native Testing
1. **iOS Simulator:**
   ```bash
   npx react-native run-ios
   ```

2. **Android Emulator:**
   ```bash
   npx react-native run-android
   ```

3. **Physical Device:**
   - Connect device via USB
   - Enable USB debugging (Android)
   - Trust device (iOS)
   - Run on device

### Cross-Platform Testing
- Test on different screen sizes
- Test with different network conditions
- Test with app in background/foreground
- Test with multiple app instances

## 🔒 Security Testing

### Authentication Tests
- [ ] Invalid token rejected
- [ ] Expired token handled
- [ ] User permissions enforced
- [ ] Rate limiting works

### Data Validation Tests
- [ ] Malicious input sanitized
- [ ] SQL injection prevented
- [ ] XSS attacks blocked
- [ ] Input length limits enforced

## 📈 Monitoring

### Key Metrics to Track
- Active battle rooms
- Concurrent players
- Average battle duration
- Question response times
- Error rates
- Server response times

### Logging
```javascript
// Add structured logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'battle-logs.json' })
  ]
});

logger.info('Battle started', { roomId, playerCount, timestamp });
```

## ✅ Final Checklist

Before going live:

- [ ] All test scenarios pass
- [ ] Performance benchmarks met
- [ ] Security tests passed
- [ ] Mobile testing completed
- [ ] Error handling verified
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Documentation updated
- [ ] Backup strategy in place
- [ ] Rollback plan ready

## 🚀 Production Deployment

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
PORT=3001
DB_HOST=production-db-host
DB_USER=production-user
DB_PASSWORD=production-password
JWT_SECRET=production-secret
```

### Deployment Steps
1. Set up production database
2. Configure environment variables
3. Deploy backend code
4. Set up monitoring
5. Configure load balancer
6. Test production environment
7. Deploy frontend
8. Monitor performance

## 📞 Support

If you encounter issues:

1. Check the logs for error messages
2. Verify all dependencies are installed
3. Ensure database is properly configured
4. Test with the provided test files
5. Check network connectivity
6. Verify environment variables

For additional help, refer to the main documentation or create an issue in the project repository.
