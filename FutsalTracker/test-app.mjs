// Comprehensive test suite for futsal team management app
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('Starting comprehensive app tests...\n');
  
  try {
    // Test 1: Teams API
    console.log('1. Testing Teams API...');
    const teamsResponse = await axios.get(`${BASE_URL}/api/teams`);
    console.log(`✓ GET /api/teams: ${teamsResponse.status} - ${teamsResponse.data.length} teams found`);
    
    const newTeam = await axios.post(`${BASE_URL}/api/teams`, {
      name: 'Test Integration Team'
    });
    console.log(`✓ POST /api/teams: ${newTeam.status} - Team created with ID ${newTeam.data.id}`);
    
    // Test 2: Players API
    console.log('\n2. Testing Players API...');
    const playersResponse = await axios.get(`${BASE_URL}/api/players`);
    console.log(`✓ GET /api/players: ${playersResponse.status} - ${playersResponse.data.length} players found`);
    
    const newPlayer = await axios.post(`${BASE_URL}/api/players`, {
      name: 'Test Player Integration',
      teamId: newTeam.data.id,
      jerseyNumber: 99,
      position: 'Portero'
    });
    console.log(`✓ POST /api/players: ${newPlayer.status} - Player created with ID ${newPlayer.data.id}`);
    
    // Test 3: Matches API
    console.log('\n3. Testing Matches API...');
    const matchesResponse = await axios.get(`${BASE_URL}/api/matches`);
    console.log(`✓ GET /api/matches: ${matchesResponse.status} - ${matchesResponse.data.length} matches found`);
    
    const newMatch = await axios.post(`${BASE_URL}/api/matches`, {
      teamId: newTeam.data.id,
      opponent: 'Test Opponent Integration',
      venue: 'Test Venue',
      competition: 'Test League',
      matchDate: '2025-06-10T20:00:00.000Z',
      format: 'league',
      formatSettings: {
        halfDuration: 25,
        numberOfHalves: 2,
        playersOnField: 5
      }
    });
    console.log(`✓ POST /api/matches: ${newMatch.status} - Match created with ID ${newMatch.data.id}`);
    
    // Test 4: Match Events API
    console.log('\n4. Testing Match Events API...');
    const newEvent = await axios.post(`${BASE_URL}/api/match-events`, {
      matchId: newMatch.data.id,
      playerId: newPlayer.data.id,
      eventType: 'goal',
      eventTime: 15,
      half: 1,
      description: 'Test integration goal'
    });
    console.log(`✓ POST /api/match-events: ${newEvent.status} - Event created with ID ${newEvent.data.id}`);
    
    // Test 5: Player Stats API
    console.log('\n5. Testing Player Stats API...');
    const newStat = await axios.post(`${BASE_URL}/api/player-stats`, {
      matchId: newMatch.data.id,
      playerId: newPlayer.data.id,
      isStarter: true,
      isCurrentlyOnField: true,
      timeOnField: 0,
      goals: 1,
      fouls: 0
    });
    console.log(`✓ POST /api/player-stats: ${newStat.status} - Stat created with ID ${newStat.data.id}`);
    
    const statsResponse = await axios.get(`${BASE_URL}/api/player-stats?matchId=${newMatch.data.id}`);
    console.log(`✓ GET /api/player-stats: ${statsResponse.status} - ${statsResponse.data.length} stats found`);
    
    // Test 6: Update Operations
    console.log('\n6. Testing Update Operations...');
    const updatedMatch = await axios.put(`${BASE_URL}/api/matches/${newMatch.data.id}`, {
      status: 'in_progress',
      homeScore: 1
    });
    console.log(`✓ PUT /api/matches: ${updatedMatch.status} - Match updated`);
    
    const updatedPlayer = await axios.put(`${BASE_URL}/api/players/${newPlayer.data.id}`, {
      name: 'Updated Test Player'
    });
    console.log(`✓ PUT /api/players: ${updatedPlayer.status} - Player updated`);
    
    // Test 7: Delete Operations
    console.log('\n7. Testing Delete Operations...');
    const deletePlayer = await axios.delete(`${BASE_URL}/api/players/${newPlayer.data.id}`);
    console.log(`✓ DELETE /api/players: ${deletePlayer.status} - Player deleted`);
    
    const deleteTeam = await axios.delete(`${BASE_URL}/api/teams/${newTeam.data.id}`);
    console.log(`✓ DELETE /api/teams: ${deleteTeam.status} - Team deleted`);
    
    console.log('\n✅ All API tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.status, error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();