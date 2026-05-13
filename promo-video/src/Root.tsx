import { Composition } from "remotion";
import { StrategyArchivePromo } from "./StrategyArchivePromo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="XhsPromo"
      component={StrategyArchivePromo}
      durationInFrames={1080}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
