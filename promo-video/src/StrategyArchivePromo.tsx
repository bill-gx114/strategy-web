import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

const paper = "#f4efdf";
const card = "#fffaf0";
const ink = "#172438";
const soft = "#58657b";
const blue = "#173b64";
const seal = "#8f2d23";
const gold = "#b78a42";
const mono = "'Courier New', 'SF Mono', Menlo, monospace";
const serif = "'Songti SC', 'Noto Serif CJK SC', 'STSong', serif";
const sans = "'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";

type SceneProps = {
  start: number;
  end: number;
  children: React.ReactNode;
};

type DownloadRequirement = "single" | "category" | "selection" | "all";

function sceneOpacity(frame: number, start: number, end: number) {
  return Math.min(
    interpolate(frame, [start, start + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [end - 18, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );
}

function useAppear(start: number, distance = 34) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - start,
    fps,
    config: { damping: 18, mass: 0.7, stiffness: 120 }
  });
  return {
    opacity: interpolate(frame, [start, start + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
  };
}

function Scene({ start, end, children }: SceneProps) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, start, end) }}>
      {children}
    </AbsoluteFill>
  );
}

function Background() {
  return (
    <AbsoluteFill
      style={{
        background:
          `radial-gradient(circle at 10% 10%, rgba(183,138,66,.34), transparent 410px),
           radial-gradient(circle at 90% 12%, rgba(23,59,100,.20), transparent 440px),
           radial-gradient(circle at 52% 92%, rgba(143,45,35,.18), transparent 460px),
           linear-gradient(145deg, #fffaf0 0%, ${paper} 52%, #eadfc6 100%)`,
        fontFamily: sans,
        color: ink,
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.34,
          backgroundImage:
            "linear-gradient(rgba(23,36,56,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(23,36,56,.10) 1px, transparent 1px)",
          backgroundSize: "52px 52px"
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.2,
          backgroundImage: "repeating-linear-gradient(105deg, rgba(23,36,56,.16) 0, rgba(23,36,56,.16) 1px, transparent 1px, transparent 9px)"
        }}
      />
    </AbsoluteFill>
  );
}

function BrandBar() {
  return (
    <div
      style={{
        position: "absolute",
        top: 54,
        left: 58,
        right: 58,
        height: 86,
        border: "2px solid rgba(23,36,56,.22)",
        background: "rgba(255,250,240,.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 26px",
        boxShadow: "0 20px 54px rgba(23,36,56,.12)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 54,
            height: 54,
            border: `3px solid ${seal}`,
            display: "grid",
            placeItems: "center",
            fontFamily: serif,
            color: seal,
            fontSize: 20,
            fontWeight: 900,
            transform: "rotate(-7deg)"
          }}
        >
          档
        </div>
        <div>
          <div style={{ fontFamily: serif, fontSize: 30, fontWeight: 900, letterSpacing: 2 }}>大厂策略产品搬砖狗档案馆</div>
          <div style={{ fontFamily: mono, fontSize: 15, color: soft, letterSpacing: 3, textTransform: "uppercase" }}>Private strategy archive</div>
        </div>
      </div>
      <div style={{ fontFamily: mono, color: seal, fontSize: 18 }}>XHS PROMO</div>
    </div>
  );
}

function Seal({ text = "已归档", size = 132, style }: { text?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `7px double ${seal}`,
        display: "grid",
        placeItems: "center",
        color: seal,
        fontFamily: serif,
        fontWeight: 900,
        fontSize: size * 0.22,
        transform: "rotate(-10deg)",
        background: "rgba(255,250,240,.68)",
        ...style
      }}
    >
      {text}
    </div>
  );
}

function BigTitle({ lines, start }: { lines: string[]; start: number }) {
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 280 }}>
      {lines.map((line, index) => {
        const appear = useAppear(start + index * 9, 46);
        return (
          <div
            key={line}
            style={{
              ...appear,
              fontFamily: serif,
              fontSize: index === 0 ? 92 : 82,
              lineHeight: 1.08,
              letterSpacing: -5,
              fontWeight: 900,
              color: ink,
              marginBottom: 18
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
}

function BrowserMock({ active = "home", compact = false }: { active?: "home" | "detail" | "invite" | "download"; compact?: boolean }) {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame / 12), [-1, 1], [0.64, 1]);
  return (
    <div
      style={{
        width: compact ? 850 : 900,
        minHeight: compact ? 800 : 980,
        border: "2px solid rgba(23,36,56,.26)",
        background: card,
        boxShadow: "0 38px 80px rgba(23,36,56,.22)",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          height: 72,
          background: "#172438",
          color: "#fffaf0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          fontFamily: mono,
          fontSize: 18
        }}
      >
        <span>strategy-archive-site.vercel.app</span>
        <span style={{ color: active === "invite" ? "#fff" : "#d7c59b" }}>{active === "invite" ? "输入邀请码" : "免费浏览"}</span>
      </div>
      <div style={{ padding: 30 }}>
        <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: 24 }}>
          <div>
            <PanelTitle zh="档案目录" en="FOLDERS" />
            {["全部内容", "策略产品入门专栏", "策略产品进阶专栏", "推荐PM手把手入门专栏", "AI时代策略产品工作方式"].map((item, index) => (
              <div
                key={item}
                style={{
                  marginTop: 12,
                  padding: "14px 15px",
                  border: `2px solid ${index === 2 ? "rgba(23,59,100,.42)" : "rgba(23,36,56,.12)"}`,
                  background: index === 2 ? "rgba(23,59,100,.08)" : "rgba(244,239,223,.58)",
                  display: "flex",
                  justifyContent: "space-between",
                  color: index === 0 ? seal : ink,
                  fontSize: 19
                }}
              >
                <span>{item}</span>
                <span style={{ fontFamily: mono }}>{index === 0 ? 115 : [18, 21, 30, 12][index - 1]}</span>
              </div>
            ))}
          </div>
          <div>
            <div
              style={{
                height: 62,
                border: "2px solid rgba(23,36,56,.16)",
                display: "flex",
                alignItems: "center",
                padding: "0 18px",
                color: soft,
                fontSize: 20,
                marginBottom: 18
              }}
            >
              搜索标题、分类、AI、推荐、AB Test...
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
              {[
                "推荐PM手把手入门第1讲：推荐策略到底在做什么？",
                "策略产品经理入门教程：如何搭建策略产品思维",
                "策略PM进阶教程：资深策略产品经理的抓大放小",
                "AI时代的策略产品工作方式"
              ].map((title, index) => (
                <FileCard key={title} title={title} selected={active === "download" && index < 2} locked={active === "invite" && index > 1} />
              ))}
            </div>
          </div>
        </div>
      </div>
      {active === "detail" ? (
        <div
          style={{
            position: "absolute",
            right: 68,
            top: 300,
            width: 430,
            border: "2px solid rgba(23,36,56,.28)",
            background: "linear-gradient(180deg, #fffaf0, #efe4c9)",
            boxShadow: "0 30px 70px rgba(23,36,56,.28)",
            padding: 24
          }}
        >
          <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 900, lineHeight: 1.18 }}>PDF 首屏预览 + 内容摘要</div>
          <div style={{ height: 300, marginTop: 20, border: "2px solid rgba(23,36,56,.18)", background: "#fff", padding: 22 }}>
            <div style={{ height: 22, width: "84%", background: blue, marginBottom: 18 }} />
            <div style={{ height: 16, width: "72%", background: "rgba(23,36,56,.22)", marginBottom: 12 }} />
            <div style={{ height: 16, width: "94%", background: "rgba(23,36,56,.18)", marginBottom: 12 }} />
            <div style={{ height: 110, marginTop: 32, border: `4px double ${seal}`, display: "grid", placeItems: "center", color: seal, fontFamily: serif, fontSize: 42, fontWeight: 900 }}>策略</div>
          </div>
          <div style={{ marginTop: 18, padding: 18, borderLeft: `8px solid ${blue}`, background: "rgba(23,59,100,.08)", color: soft, fontSize: 20, lineHeight: 1.55 }}>
            摘要先看懂这一篇在讲什么，再决定是否下载保存。
          </div>
        </div>
      ) : null}
      {active === "invite" ? (
        <div
          style={{
            position: "absolute",
            left: 205,
            top: 650,
            width: 610,
            padding: 32,
            border: "2px solid rgba(23,36,56,.34)",
            background: "#fffaf0",
            boxShadow: "0 34px 80px rgba(23,36,56,.30)"
          }}
        >
          <div style={{ fontFamily: mono, color: seal, fontSize: 18, letterSpacing: 3 }}>ACCESS CODE</div>
          <div style={{ fontFamily: serif, fontSize: 42, fontWeight: 900, marginTop: 8 }}>下载前验证邀请码</div>
          <div style={{ marginTop: 18, border: "2px solid rgba(23,36,56,.2)", height: 64, display: "flex", alignItems: "center", paddingLeft: 18, fontFamily: mono, fontSize: 24, color: blue }}>
            SP-••••-••••••
          </div>
          <div style={{ marginTop: 18, height: 60, background: seal, color: "#fffaf0", display: "grid", placeItems: "center", fontSize: 24, fontWeight: 800, opacity: pulse }}>
            验证并开始下载
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PanelTitle({ zh, en }: { zh: string; en: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
      <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 900 }}>{zh}</div>
      <div style={{ fontFamily: mono, color: soft, fontSize: 14, letterSpacing: 2 }}>{en}</div>
    </div>
  );
}

function FileCard({ title, selected = false, locked = false }: { title: string; selected?: boolean; locked?: boolean }) {
  return (
    <div
      style={{
        minHeight: 190,
        border: `2px solid ${selected ? seal : "rgba(23,36,56,.15)"}`,
        background: selected ? "rgba(143,45,35,.06)" : "rgba(255,250,240,.86)",
        padding: 18,
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: `linear-gradient(90deg, ${blue}, ${gold}, ${seal})` }} />
      <div style={{ fontFamily: mono, color: selected ? seal : soft, fontSize: 14 }}>{selected ? "SELECTED" : locked ? "PREVIEW ONLY" : "PDF READY"}</div>
      <div style={{ marginTop: 18, fontFamily: serif, fontSize: 24, fontWeight: 900, lineHeight: 1.24 }}>{title}</div>
      <div style={{ marginTop: 16, color: blue, fontSize: 17 }}>{locked ? "需要对应专栏码" : "查看详情 / 加入清单"}</div>
    </div>
  );
}

function FeatureChip({ text, active = false }: { text: string; active?: boolean }) {
  return (
    <div
      style={{
        height: 58,
        padding: "0 22px",
        display: "inline-flex",
        alignItems: "center",
        border: `2px solid ${active ? seal : "rgba(23,36,56,.18)"}`,
        background: active ? "rgba(143,45,35,.08)" : "rgba(255,250,240,.68)",
        color: active ? seal : ink,
        fontSize: 22,
        fontWeight: 800
      }}
    >
      {text}
    </div>
  );
}

function RightsMatrix() {
  const items = [
    { title: "策略产品入门专栏", note: "入门码可下载", color: blue },
    { title: "策略产品进阶专栏", note: "进阶码可下载", color: gold },
    { title: "推荐PM手把手入门", note: "推荐PM码可下载", color: seal },
    { title: "全部专栏打包", note: "万能码可下载全部", color: "#172438" }
  ];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {items.map((item, index) => (
        <div
          key={item.title}
          style={{
            display: "grid",
            gridTemplateColumns: "70px 1fr",
            gap: 18,
            alignItems: "center",
            padding: 22,
            background: "rgba(255,250,240,.84)",
            border: "2px solid rgba(23,36,56,.18)",
            boxShadow: "0 18px 45px rgba(23,36,56,.08)"
          }}
        >
          <div style={{ width: 64, height: 64, background: item.color, color: "#fffaf0", display: "grid", placeItems: "center", fontFamily: mono, fontWeight: 900, fontSize: 24 }}>
            {index === 3 ? "全" : index + 1}
          </div>
          <div>
            <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 900 }}>{item.title}</div>
            <div style={{ marginTop: 5, color: soft, fontSize: 22 }}>{item.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DownloadMode({ kind, label, note, active }: { kind: DownloadRequirement; label: string; note: string; active?: boolean }) {
  const badge = kind === "single" ? "01" : kind === "category" ? "02" : kind === "selection" ? "03" : "04";
  return (
    <div
      style={{
        border: `2px solid ${active ? seal : "rgba(23,36,56,.18)"}`,
        background: active ? "rgba(143,45,35,.07)" : "rgba(255,250,240,.82)",
        padding: 24,
        minHeight: 168,
        display: "grid",
        gap: 12
      }}
    >
      <div style={{ fontFamily: mono, color: active ? seal : soft, fontSize: 18 }}>{badge} / DOWNLOAD</div>
      <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 900 }}>{label}</div>
      <div style={{ color: soft, fontSize: 21, lineHeight: 1.45 }}>{note}</div>
    </div>
  );
}

function FlowStep({ number, title, note }: { number: string; title: string; note: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "88px 1fr", gap: 22, alignItems: "start" }}>
      <div style={{ width: 74, height: 74, border: `4px double ${seal}`, color: seal, display: "grid", placeItems: "center", fontFamily: mono, fontSize: 24, fontWeight: 900 }}>{number}</div>
      <div>
        <div style={{ fontFamily: serif, fontSize: 43, fontWeight: 900, lineHeight: 1.1 }}>{title}</div>
        <div style={{ marginTop: 9, color: soft, fontSize: 25, lineHeight: 1.45 }}>{note}</div>
      </div>
    </div>
  );
}

export const StrategyArchivePromo = () => {
  const frame = useCurrentFrame();
  const slowRotate = interpolate(frame, [0, 1080], [-4, 8], { easing: Easing.inOut(Easing.ease) });

  return (
    <AbsoluteFill>
      <Background />
      <BrandBar />

      <div
        style={{
          position: "absolute",
          right: -82,
          top: 210,
          width: 290,
          height: 290,
          border: "2px solid rgba(23,59,100,.16)",
          transform: `rotate(${slowRotate}deg)`,
          opacity: 0.56
        }}
      />

      <Scene start={0} end={130}>
        <BigTitle start={10} lines={["买了专栏，", "资料别再散在聊天记录里。"]} />
        <div style={{ ...useAppear(50), position: "absolute", left: 76, right: 90, top: 720, color: soft, fontSize: 36, lineHeight: 1.55 }}>
          我把小红书专栏内容，整理成一个可以浏览、预览、按权限下载的网站。
        </div>
        <Seal text="专栏资料" size={176} style={{ position: "absolute", right: 90, bottom: 360 }} />
        <div style={{ ...useAppear(72), position: "absolute", left: 76, bottom: 170, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <FeatureChip text="策略产品入门" active />
          <FeatureChip text="策略产品进阶" />
          <FeatureChip text="推荐 PM" />
        </div>
      </Scene>

      <Scene start={130} end={285}>
        <div style={{ ...useAppear(140), position: "absolute", left: 74, top: 210, right: 74 }}>
          <div style={{ fontFamily: serif, fontSize: 72, fontWeight: 900, letterSpacing: -3 }}>先免费逛，再决定下载</div>
          <div style={{ marginTop: 18, color: soft, fontSize: 30 }}>目录、搜索、分类、PDF 首屏预览，全都先给你看。</div>
        </div>
        <div style={{ ...useAppear(156), position: "absolute", left: 90, top: 430 }}>
          <BrowserMock compact />
        </div>
      </Scene>

      <Scene start={285} end={450}>
        <div style={{ ...useAppear(294), position: "absolute", left: 74, top: 210, right: 74 }}>
          <div style={{ fontFamily: serif, fontSize: 72, fontWeight: 900, letterSpacing: -3 }}>每篇内容，都能先看首屏和摘要</div>
          <div style={{ marginTop: 18, color: soft, fontSize: 30 }}>不用盲下。先看这篇讲什么，再保存到本地复习。</div>
        </div>
        <div style={{ ...useAppear(310), position: "absolute", left: 90, top: 440 }}>
          <BrowserMock active="detail" compact />
        </div>
      </Scene>

      <Scene start={450} end={610}>
        <div style={{ ...useAppear(458), position: "absolute", left: 74, top: 210, right: 74 }}>
          <div style={{ fontFamily: serif, fontSize: 72, fontWeight: 900, letterSpacing: -3 }}>专栏分开卖，权限也分开管</div>
          <div style={{ marginTop: 18, color: soft, fontSize: 30 }}>买哪个专栏，就拿哪个专栏的邀请码。买打包商品，就拿万能码。</div>
        </div>
        <div style={{ ...useAppear(480), position: "absolute", left: 96, right: 96, top: 465 }}>
          <RightsMatrix />
        </div>
      </Scene>

      <Scene start={610} end={790}>
        <div style={{ ...useAppear(620), position: "absolute", left: 74, top: 210, right: 74 }}>
          <div style={{ fontFamily: serif, fontSize: 72, fontWeight: 900, letterSpacing: -3 }}>下载不是只能一篇篇点</div>
          <div style={{ marginTop: 18, color: soft, fontSize: 30 }}>单篇、分类、全部、自选清单，都能按权限打包。</div>
        </div>
        <div style={{ ...useAppear(646), position: "absolute", left: 84, right: 84, top: 470, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <DownloadMode kind="single" label="单篇下载" note="只想保存这一篇，直接下载 PDF。" />
          <DownloadMode kind="category" label="分类打包" note="一个专栏一整个 ZIP，适合系统学习。" />
          <DownloadMode kind="selection" label="自选清单 ZIP" note="把想看的几篇加入清单，再一起下载。" active />
          <DownloadMode kind="all" label="全部内容" note="万能码专属，整站资料一次保存。" />
        </div>
        <div style={{ ...useAppear(700), position: "absolute", left: 142, bottom: 160, right: 142, height: 112, background: blue, color: "#fffaf0", display: "grid", placeItems: "center", fontSize: 35, fontWeight: 900, boxShadow: "0 28px 70px rgba(23,36,56,.25)" }}>
          自选清单已生成 ZIP
        </div>
      </Scene>

      <Scene start={790} end={960}>
        <div style={{ ...useAppear(802), position: "absolute", left: 74, top: 210, right: 74 }}>
          <div style={{ fontFamily: serif, fontSize: 75, fontWeight: 900, letterSpacing: -3 }}>购买后的使用路径，很简单</div>
        </div>
        <div style={{ ...useAppear(830), position: "absolute", left: 102, right: 90, top: 460, display: "grid", gap: 54 }}>
          <FlowStep number="01" title="去小红书店铺下单" note="选择你需要的专栏：入门、进阶、推荐 PM，或全部打包。" />
          <FlowStep number="02" title="收到网站链接 + 邀请码" note="单专栏码只解锁对应专栏，万能码解锁全部资料。" />
          <FlowStep number="03" title="打开网站，浏览和下载" note="先看摘要和预览，再按单篇、分类或清单下载。" />
        </div>
      </Scene>

      <Scene start={960} end={1080}>
        <div style={{ ...useAppear(970), position: "absolute", left: 80, right: 80, top: 250, textAlign: "center" }}>
          <div style={{ fontFamily: serif, fontSize: 88, lineHeight: 1.1, fontWeight: 900, letterSpacing: -4 }}>
            想系统补齐策略产品能力？
          </div>
          <div style={{ marginTop: 44, color: soft, fontSize: 34, lineHeight: 1.55 }}>
            先选专栏，再拿邀请码。<br />资料库会帮你把内容整理好、保存好、随时复习。
          </div>
        </div>
        <div style={{ ...useAppear(1010), position: "absolute", left: 116, right: 116, bottom: 300, padding: "38px 30px", border: `3px solid ${seal}`, background: "rgba(255,250,240,.86)", textAlign: "center", boxShadow: "0 26px 70px rgba(23,36,56,.18)" }}>
          <div style={{ fontFamily: mono, color: seal, fontSize: 22, letterSpacing: 4 }}>CALL TO ACTION</div>
          <div style={{ marginTop: 16, fontFamily: serif, fontSize: 58, fontWeight: 900 }}>去主页店铺购买专栏内容</div>
          <div style={{ marginTop: 16, color: soft, fontSize: 27 }}>下单后领取网站入口和专属邀请码</div>
        </div>
        <Seal text="开始搬砖" size={190} style={{ position: "absolute", left: 445, bottom: 92 }} />
      </Scene>
    </AbsoluteFill>
  );
};
