import { css } from "@emotion/react";
import { useAppSelector } from "../../../store";
import { CenteredSpinner } from "../../post/detail/PostDetail";
import GenericSidebar from "./GenericSidebar";
import { IonBadge } from "@ionic/react";
import { lemmyVersionSelector } from "../../auth/authSlice";

export default function InstanceSidebar() {
  const siteView = useAppSelector((state) => state.auth.site?.site_view);
  const admins = useAppSelector((state) => state.auth.site?.admins);
  const lemmyVersion = useAppSelector(lemmyVersionSelector);

  if (!siteView || !admins)
    return (
      <CenteredSpinner
        css={css`
          margin-top: 25vh;
        `}
      />
    );

  const { site, counts } = siteView;

  return (
    <GenericSidebar
      type="instance"
      sidebar={site.sidebar ?? site.description ?? ""}
      people={admins.map((a) => a.person)}
      counts={counts}
      extraBadges={<IonBadge color="dark">v{lemmyVersion}</IonBadge>}
      banner={site.banner}
      name={site.actor_id}
    />
  );
}
