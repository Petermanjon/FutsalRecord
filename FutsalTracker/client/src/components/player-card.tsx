import { Button } from "@/components/ui/button";
import { X, Edit } from "lucide-react";
import { type Player } from "@shared/schema";

interface PlayerCardProps {
  player: Player;
  onDelete: () => void;
  onEdit?: () => void;
}

export default function PlayerCard({ player, onDelete, onEdit }: PlayerCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[hsl(207,90%,54%)] rounded-full flex items-center justify-center text-white font-bold">
            {player.jerseyNumber}
          </div>
          <div>
            <h4 className="font-medium">{player.name}</h4>
            <p className="text-sm text-gray-600">{player.position}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-red-500"
          onClick={onDelete}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">
          Dorsal #{player.jerseyNumber}
        </span>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="text-[hsl(207,90%,54%)] hover:underline"
            onClick={onEdit}
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
        )}
      </div>
    </div>
  );
}
