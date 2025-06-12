import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Play, Users, Trophy, Coins } from "lucide-react";
// Using data URL for Golden Dragon image
const goldenDragonImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDYwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImJnR3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMzMzM2ZmO3N0b3Atb3BhY2l0eToxIiAvPgo8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2NjMzZmY7c3RvcC1vcGFjaXR5OjEiIC8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0iZHJhZ29uR3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmZkNzAwO3N0b3Atb3BhY2l0eToxIiAvPgo8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZjk5MDA7c3RvcC1vcGFjaXR5OjEiIC8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9InVybCgjYmdHcmFkaWVudCkiLz4KPHN2ZyB4PSIxMDAiIHk9IjUwIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiPgo8IS0tIERyYWdvbiBTaWxob3VldHRlIC0tPgo8cGF0aCBkPSJNNTAgMTAwIEM1MCA4MCA3MCA2MCA5MCA2MCBDMTA1IDYwIDEyMCA3MCAxMzAgODAgQzE0MCA5MCAxNTAgODUgMTYwIDkwIEMxNzAgMTAwIDE4MCA5MCAyMDAgMTAwIEMxOTAgMTIwIDE4MCAxMzAgMTcwIDE0MCBDMTU1IDE1MCAxNDAgMTQwIDEzMCAxMzAgQzEyMCAxNDAgMTA1IDE1MCA5MCAxNDAgQzcwIDEzMCA1MCAxMjAgNTAgMTAwWiIgZmlsbD0idXJsKCNkcmFnb25HcmFkaWVudCkiLz4KPC9zdmc+CjwhLS0gR2FtZSBUaXRsZSAtLT4KPHR4dCB4PSIzMDAiIHk9IjE4MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2ZmZDcwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+R09MREVOID0+PC90eHQ+Cjx0eHQgeD0iMzAwIiB5PSIyMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI0OCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNmZmQ3MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkRSQUdPTjwvdHh0Pgo8L3N2Zz4=";

export default function Games() {
  const { user } = useAuth();

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
    }
  ];

  const handlePlayGame = (game: any) => {
    // Here you would typically redirect to the game or open game launcher
    console.log(`Launching ${game.name}...`);
    window.open('https://goldendragoncity.com', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Game Library</h1>
          <p className="text-gray-400 text-lg">
            Discover amazing games powered by your gaming credits
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
                  <p className="text-2xl font-bold text-white">1</p>
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
                  <p className="text-2xl font-bold text-white">2.8K+</p>
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
      </div>
    </div>
  );
}