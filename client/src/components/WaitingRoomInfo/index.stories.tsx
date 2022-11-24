import { Story, Meta } from "@storybook/react";
import WaitingRoomInfo, { WaitingRoomInfoProps } from ".";

export default {
  title: "공통 컴포넌트/대기실 정보",
  component: WaitingRoomInfo,
} as Meta;

const Template: Story<WaitingRoomInfoProps> = args => <WaitingRoomInfo {...args} />;

export const Default = Template.bind({});
Default.storyName = "대기실 정보";
Default.args = {
  roomRecord: {
    gameRoomId: 1,
    isPrivate: true,
    title: "캐마 초보만",
    gameId: 1,
    currentPeople: 6,
    maximumPeople: 8,
  },
  camList: [
    {
      isVideoOn: false,
      isAudioOn: false,
      profile: "https://avatars.githubusercontent.com/u/102232291?v=4",
      nickname: "아임더베스트",
      scoreRank: "2500 (1위)",
    },
    {
      isVideoOn: false,
      isAudioOn: false,
      profile: "https://avatars.githubusercontent.com/u/102232291?v=4",
      nickname: "아임더세컨드",
      scoreRank: "2315 (2위)",
    },
    {
      isVideoOn: false,
      isAudioOn: false,
      profile: "https://avatars.githubusercontent.com/u/102232291?v=4",
      nickname: "아임더워스트",
      scoreRank: "516 (794위)",
    },
    {
      isVideoOn: false,
      isAudioOn: false,
      profile: "https://avatars.githubusercontent.com/u/102232291?v=4",
      nickname: "하이요",
      scoreRank: "1217 (234위)",
    },
    {
      isVideoOn: false,
      isAudioOn: false,
      profile: "https://avatars.githubusercontent.com/u/102232291?v=4",
      nickname: "바이요",
      scoreRank: "1125 (366위)",
    },
    {
      isVideoOn: false,
      isAudioOn: false,
      profile: "https://avatars.githubusercontent.com/u/102232291?v=4",
      nickname: "캐마고수",
      scoreRank: "2155 (15위)",
    },
  ],
};
