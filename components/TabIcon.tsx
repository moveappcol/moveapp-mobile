import Svg, { Circle, Path, Rect } from "react-native-svg";

type TabIconName = "gimnasios" | "planes" | "nosotros" | "reservas" | "perfil";

export function TabIcon({ name, color }: { name: TabIconName; color: string }) {
  const common = { width: 19, height: 19, viewBox: "0 0 24 24" };
  const stroke = { stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

  switch (name) {
    case "gimnasios":
      return (
        <Svg {...common}>
          <Rect x="3" y="10" width="4" height="9" {...stroke} />
          <Rect x="10" y="6" width="4" height="13" {...stroke} />
          <Rect x="17" y="3" width="4" height="16" {...stroke} />
        </Svg>
      );
    case "planes":
      return (
        <Svg {...common}>
          <Rect x="2" y="5" width="20" height="14" rx="2" {...stroke} />
          <Path d="M2 10h20" {...stroke} />
        </Svg>
      );
    case "nosotros":
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M12 11v5" {...stroke} />
          <Circle cx="12" cy="8" r="0.6" fill={color} />
        </Svg>
      );
    case "reservas":
      return (
        <Svg {...common}>
          <Rect x="3" y="5" width="18" height="16" rx="2" {...stroke} />
          <Path d="M16 3v4M8 3v4M3 10h18" {...stroke} />
        </Svg>
      );
    case "perfil":
      return (
        <Svg {...common}>
          <Circle cx="12" cy="8" r="4" {...stroke} />
          <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" {...stroke} />
        </Svg>
      );
  }
}
