import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { 
  Play, 
  Users, 
  Trophy, 
  Coins
} from "lucide-react";
import CollapsibleSidebar from "@/components/collapsible-sidebar";
// Using asset imports for game images
// Using images from public directory for deployment compatibility
const magicCityImage = "/images/magic-city.png";
const ultraPandaImage = "/images/ultra-panda.png";
const goldenDragonImage = "/images/golden-dragon.png";

export default function Games() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const games = [
    {
      id: 1,
      name: "Golden Dragon",
      image: goldenDragonImage,
      description: "Embark on an epic adventure in this fantasy MMORPG. Battle dragons, collect treasures, and build your empire in a mystical world.",
      status: "Live",
      players: "2,847",
      minCredits: 100,
      categories: ["MMORPG", "Fantasy", "Adventure"],
      features: [
        "Massive multiplayer battles",
        "Dragon taming system", 
        "Guild wars and alliances",
        "Crafting and trading",
        "Epic boss raids"
      ]
    },
    {
      id: 2,
      name: "Ultra Panda",
      image: ultraPandaImage,
      description: "Join the adorable panda on an exciting slot adventure! Spin the reels, collect golden coins, and unlock amazing bonus features in this colorful casino game.",
      status: "Live",
      players: "1,924",
      minCredits: 50,
      categories: ["Slots", "Casino", "Adventure"],
      features: [
        "Multiple slot machines",
        "Progressive jackpots",
        "Bonus mini-games",
        "Daily rewards system",
        "Lucky wheel spins"
      ]
    },
    {
      id: 3,
      name: "Magic City",
      image: magicCityImage,
      description: "Enter the mystical realm of Magic City where spells and fortunes await. Experience magical slot gameplay with enchanting graphics and spellbinding wins.",
      status: "Live", 
      players: "3,156",
      minCredits: 75,
      categories: ["Slots", "Magic", "Fantasy"],
      features: [
        "Magical themed slots",
        "Spell-based bonus rounds",
        "Enchanted free spins",
        "Mystical multipliers",
        "Wizard tournaments"
      ]
    }
  ];

  const handlePlayGame = (game: any) => {
    // Here you would typically redirect to the game or open game launcher
    console.log(`Launching ${game.name}...`);
    
    // Open different URLs based on the game
    switch (game.id) {
      case 1: // Golden Dragon
        window.open('https://goldendragoncity.com', '_blank');
        break;
      case 2: // Ultra Panda
        window.open('https://ultrapanda777.com', '_blank');
        break;
      case 3: // Magic City
        window.open('https://magiccity777.com', '_blank');
        break;
      default:
        console.log('Game URL not configured');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="flex">
        <CollapsibleSidebar onLogout={() => window.location.href = "/api/logout"} />

        {/* Main Content */}
        <main className="flex-1 p-8 pt-20 lg:pt-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">{t('games.title')}</h1>
            <p className="text-gray-400 text-lg">
              {t('games.subtitle')}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Play className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">3</p>
                  <p className="text-sm text-gray-400">Games Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">7.9K+</p>
                  <p className="text-sm text-gray-400">Active Players</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Coins className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{user?.credits?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-400">Your Credits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">Epic</p>
                  <p className="text-sm text-gray-400">Experience Level</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {games.map((game) => (
            <Card key={game.id} className="bg-zinc-800/50 border-zinc-700 overflow-hidden hover:border-zinc-600 transition-all duration-300 hover:scale-105">
              {/* Game Image */}
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={game.image} 
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-500/90 text-white border-0">
                    {game.status}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="border-white/20 text-white bg-black/50">
                    {game.players} players
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Game Title */}
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{game.name}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {game.description}
                    </p>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2">
                    {game.categories.map((category) => (
                      <Badge key={category} variant="secondary" className="bg-zinc-700 text-gray-300 border-0">
                        {category}
                      </Badge>
                    ))}
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="text-white font-medium mb-2">Features:</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {game.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Credits Required */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
                    <div className="flex items-center space-x-2">
                      <Coins className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm text-gray-400">
                        Min. {game.minCredits} credits
                      </span>
                    </div>
                    <Button 
                      onClick={() => handlePlayGame(game)}
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-medium"
                      disabled={(user?.credits || 0) < game.minCredits}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Coming Soon</h2>
          <Card className="bg-zinc-800/30 border-zinc-700 border-dashed">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-zinc-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">More Games Coming</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                We're working on adding more exciting games to our platform. 
                Stay tuned for updates and new gaming experiences!
              </p>
            </CardContent>
          </Card>
          </div>
        </main>
      </div>
    </div>
  );
}