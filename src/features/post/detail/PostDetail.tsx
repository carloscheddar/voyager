import { IonIcon, IonItem, IonSpinner, useIonViewDidEnter } from "@ionic/react";
import { useAppDispatch, useAppSelector } from "../../../store";
import Stats from "./Stats";
import styled from "@emotion/styled";
import Embed from "../shared/Embed";
import Comments, { CommentsHandle } from "../../comment/Comments";
import Markdown from "../../shared/Markdown";
import PostActions from "../actions/PostActions";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { findLoneImage } from "../../../helpers/markdown";
import { setPostRead } from "../postSlice";
import { maxWidthCss } from "../../shared/AppContent";
import PersonLink from "../../labels/links/PersonLink";
import { CommentSortType, PostView } from "lemmy-js-client";
import ViewAllComments from "./ViewAllComments";
import InlineMarkdown from "../../shared/InlineMarkdown";
import { megaphone } from "ionicons/icons";
import CommunityLink from "../../labels/links/CommunityLink";
import Nsfw, { isNsfw } from "../../labels/Nsfw";
import { PageContext } from "../../auth/PageContext";
import { scrollIntoView } from "../../../helpers/dom";
import JumpFab from "../../comment/JumpFab";
import { OTapToCollapseType } from "../../../services/db";
import Locked from "./Locked";
import useAppToast from "../../../helpers/useAppToast";
import { postLocked } from "../../../helpers/toastMessages";
import Media from "../../shared/Media";
import { isUrlMedia } from "../../../helpers/url";

const BorderlessIonItem = styled(IonItem)`
  --padding-start: 0;
  --inner-padding-end: 0;

  --inner-border-width: 0 0 1px 0;

  ${maxWidthCss}
`;

export const CenteredSpinner = styled(IonSpinner)`
  position: relative;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`;

const Container = styled.div`
  margin: 0 0 16px;
  width: 100%;
`;

const StyledMarkdown = styled(Markdown)`
  margin: 16px 0;

  img {
    display: block;
    max-width: 100%;
    max-height: 50vh;
    object-fit: contain;
    object-position: 0%;
  }
`;

const StyledEmbed = styled(Embed)`
  margin: 16px 0;
`;

const PostDeets = styled.div`
  margin: 0 8px;
  font-size: 0.9375em;
`;

const Title = styled.div`
  font-size: 1.125rem;
  padding: 16px 0 0;
  margin-bottom: 16px;
`;

const By = styled.div`
  font-size: 0.875em;

  margin-bottom: 5px;
  color: var(--ion-color-text-aside);

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const AnnouncementIcon = styled(IonIcon)`
  font-size: 1.1rem;
  margin-right: 5px;
  vertical-align: middle;
  color: var(--ion-color-success);
`;

interface PostDetailProps {
  post: PostView;
  commentPath: string | undefined;
  sort: CommentSortType;
}

export default function PostDetail({
  post,
  commentPath,
  sort,
}: PostDetailProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hasMediaError, setHasMediaError] = useState(false);
  const dispatch = useAppDispatch();
  const markdownLoneImage = useMemo(
    () => (post?.post.body ? findLoneImage(post.post.body) : undefined),
    [post],
  );
  const { showJumpButton, jumpButtonPosition } = useAppSelector(
    (state) => state.settings.general.comments,
  );
  const titleRef = useRef<HTMLDivElement>(null);
  const { presentLoginIfNeeded, presentCommentReply } = useContext(PageContext);
  const [ionViewEntered, setIonViewEntered] = useState(false);
  const commentsRef = useRef<CommentsHandle>(null);
  const { tapToCollapse } = useAppSelector(
    (state) => state.settings.general.comments,
  );
  const presentToast = useAppToast();

  const [viewAllCommentsSpace, setViewAllCommentsSpace] = useState(70); // px

  // Avoid rerender from marking a post as read until the page
  // has fully transitioned in.
  // This keeps the page transition as performant as possible
  useEffect(() => {
    if (!post || !ionViewEntered) return;

    dispatch(setPostRead(+post.post.id));
  }, [post, ionViewEntered, dispatch]);

  useIonViewDidEnter(() => {
    setIonViewEntered(true);
  });

  useEffect(() => {
    if (!titleRef.current) return;

    scrollIntoView(titleRef.current);
  }, [collapsed]);

  const onHeight = useCallback(
    (height: number) => setViewAllCommentsSpace(height),
    [],
  );

  function renderText() {
    if (!post) return;

    if (post.post.body && !markdownLoneImage) {
      return (
        <>
          {post.post.url &&
            (!isUrlMedia(post.post.embed_video_url || post.post.url) ||
              hasMediaError) && <Embed post={post} />}
          <StyledMarkdown>{post.post.body}</StyledMarkdown>
        </>
      );
    }

    if (
      post.post.url &&
      (!isUrlMedia(post.post.embed_video_url || post.post.url) || hasMediaError)
    ) {
      return <StyledEmbed post={post} />;
    }
  }

  function renderHeader(post: PostView) {
    return (
      <>
        <BorderlessIonItem
          onClick={(e) => {
            if (e.target instanceof HTMLElement && e.target.nodeName === "A")
              return;

            if (
              tapToCollapse === OTapToCollapseType.Neither ||
              tapToCollapse === OTapToCollapseType.OnlyComments
            )
              return;

            setCollapsed(!collapsed);
          }}
        >
          <Container>
            {!hasMediaError && (
              <div onClick={(e) => e.stopPropagation()}>
                <Media
                  post={post}
                  detail={true}
                  blur={false}
                  onError={() => setHasMediaError(true)}
                />
              </div>
            )}
            <PostDeets>
              <Title ref={titleRef}>
                <InlineMarkdown>{post.post.name}</InlineMarkdown>{" "}
                {isNsfw(post) && <Nsfw />}
              </Title>
              {!collapsed && renderText()}
              <By>
                {post.post.featured_community || post.post.featured_local ? (
                  <AnnouncementIcon icon={megaphone} />
                ) : undefined}
                <CommunityLink
                  community={post.community}
                  showInstanceWhenRemote
                  subscribed={post.subscribed}
                />{" "}
                <PersonLink person={post.creator} prefix="by" />
              </By>
              <Stats post={post} />
              {post.post.locked && <Locked />}
            </PostDeets>
          </Container>
        </BorderlessIonItem>
        <BorderlessIonItem>
          <PostActions
            post={post}
            onReply={async () => {
              if (presentLoginIfNeeded()) return;
              if (post.post.locked) {
                presentToast(postLocked);
                return;
              }

              const reply = await presentCommentReply(post);

              if (reply) commentsRef.current?.prependComments([reply]);
            }}
          />
        </BorderlessIonItem>
      </>
    );
  }

  const bottomPadding: number = (() => {
    if (commentPath) return viewAllCommentsSpace + 12;

    if (
      showJumpButton &&
      (jumpButtonPosition === "left-bottom" ||
        jumpButtonPosition === "center" ||
        jumpButtonPosition === "right-bottom")
    )
      return 75;

    return 0;
  })();

  return (
    <>
      <Comments
        ref={commentsRef}
        header={renderHeader(post)}
        postId={post.post.id}
        commentPath={commentPath}
        op={post.creator}
        sort={sort}
        bottomPadding={bottomPadding}
      />
      {commentPath && <ViewAllComments onHeight={onHeight} />}
      {!commentPath && showJumpButton && <JumpFab />}
    </>
  );
}
