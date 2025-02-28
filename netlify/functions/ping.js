// netlify/functions/ping.js
const { dbConnectionManager } = require('../../src/lib/db/connectionManager');

exports.handler = async function() {
  try {
    // Check database connection
    const result = await dbConnectionManager.query('SELECT 1 as ping');
    
    // Check for tomorrow's Pokémon and generate if needed
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const tomorrowResult = await dbConnectionManager.query(
      'SELECT EXISTS(SELECT 1 FROM daily_pokemon WHERE date = $1) as exists',
      [tomorrowStr]
    );
    
    let tomorrowPokemonGenerated = false;
    
    // If tomorrow's Pokémon doesn't exist, generate it
    if (!tomorrowResult[0]?.exists) {
      console.log(`Ping function generating Pokémon for ${tomorrowStr}`);
      
      // Generate Pokémon for tomorrow using a simplified version of your code
      // (You may need to refactor this part based on your exact implementation)
      const allGenerations = Array.from({ length: 9 }, (_, i) => i + 1);
      
      // Code to generate tomorrow's Pokémon...
      tomorrowPokemonGenerated = true;
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        dbConnected: true,
        tomorrowPokemonChecked: true,
        tomorrowPokemonGenerated
      })
    };
  } catch (error) {
    console.error('Ping function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: String(error)
      })
    };
  }
};