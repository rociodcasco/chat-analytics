import { memo, ReactNode } from "react";

import { ChannelAvatar } from "@report/components/core/avatars/ChannelAvatar";
import { BaseLabel, LabelProps } from "@report/components/core/labels/BaseLabel";
import { useDataProvider } from "@report/DataProvider";

import Hashtag from "@assets/images/icons/hashtag.svg";

const _ChannelLabel = ({ index }: LabelProps) => {
    const dp = useDataProvider();
    const platform = dp.database.config.platform;
    const channel = dp.database.channels[index];
    const guild = dp.database.guilds[channel.guildIndex];

    const parts: ReactNode[] = [];

    let title = "";
    let name: ReactNode = channel.name;
    let avatar: ReactNode;
    let icon: ReactNode | undefined;

    if (platform === "discord") {
        // prepend the guild name to the channel name
        title = guild.name + " > " + name;

        if (channel.type === "text") {
            // show a # before channel names because Discord does it
            icon = <img src={Hashtag} height={12} />;
        }
    }

    const showAvatar =
        channel.type !== "text" ||
        // if there are more than two guilds in the report, show the guild avatar
        // so users can distinguish between channels with the same name
        dp.database.guilds.length >= 2;

    if (showAvatar) {
        avatar = <ChannelAvatar index={index} />;
    }

    return <BaseLabel title={title} name={name} icon={icon} avatar={avatar} />;
};

export const ChannelLabel = memo(_ChannelLabel) as typeof _ChannelLabel;
