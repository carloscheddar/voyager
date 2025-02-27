import { CommentNodeI } from "../../helpers/lemmy";
import Comment from "./Comment";
import React, { useMemo } from "react";
import CommentHr from "./CommentHr";
import { useAppDispatch, useAppSelector } from "../../store";
import { updateCommentCollapseState } from "./commentSlice";
import { Person } from "lemmy-js-client";
import CommentExpander from "./CommentExpander";
import { OTapToCollapseType } from "../../services/db";
import { getOffsetTop, scrollIntoView } from "../../helpers/dom";

interface CommentTreeProps {
  comment: CommentNodeI;
  highlightedCommentId?: number;
  first?: boolean;
  op: Person;
  fullyCollapsed?: boolean;
  rootIndex: number;
}

export default function CommentTree({
  comment,
  highlightedCommentId,
  first,
  op,
  fullyCollapsed,
  rootIndex,
}: CommentTreeProps) {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(
    (state) =>
      state.comment.commentCollapsedById[comment.comment_view.comment.id],
  );
  const { tapToCollapse } = useAppSelector(
    (state) => state.settings.general.comments,
  );

  // Comment context chains don't show missing for parents
  const showMissing = useMemo(() => {
    if (!highlightedCommentId) return true;

    if (
      comment.comment_view.comment.path
        .split(".")
        .includes(`${highlightedCommentId}`)
    )
      return true;

    return false;
  }, [comment.comment_view.comment.path, highlightedCommentId]);

  function setCollapsed(collapsed: boolean) {
    dispatch(
      updateCommentCollapseState({
        commentId: comment.comment_view.comment.id,
        collapsed,
      }),
    );
  }

  // eslint-disable-next-line no-sparse-arrays
  const payload = [
    <React.Fragment key={comment.comment_view.comment.id}>
      {!first && <CommentHr depth={comment.depth} />}
      <Comment
        comment={comment.comment_view}
        highlightedCommentId={highlightedCommentId}
        depth={comment.depth}
        onClick={(e) => {
          if (
            tapToCollapse === OTapToCollapseType.Neither ||
            tapToCollapse === OTapToCollapseType.OnlyHeaders
          )
            return;

          setCollapsed(!collapsed);

          scrollViewUpIfNeeded(e.target);
        }}
        collapsed={collapsed}
        fullyCollapsed={!!fullyCollapsed}
        rootIndex={rootIndex}
      />
    </React.Fragment>,
    ...comment.children.map((comment) => (
      <CommentTree
        key={comment.comment_view.comment.id}
        highlightedCommentId={highlightedCommentId}
        comment={comment}
        op={op}
        fullyCollapsed={collapsed || fullyCollapsed}
        rootIndex={rootIndex}
      />
    )),
  ];

  if (showMissing && comment.missing && comment.missing > 0) {
    payload.push(
      <CommentExpander
        key={`${comment.comment_view.comment.id}--expand`}
        comment={comment.comment_view}
        depth={comment.depth + 1}
        missing={comment.missing}
        collapsed={collapsed || fullyCollapsed}
      />,
    );
  }

  return payload;
}

export function scrollViewUpIfNeeded(target: EventTarget) {
  if (!(target instanceof HTMLElement)) return;

  const scrollView = target.closest(".virtual-scroller");
  const item = target.closest("ion-item-sliding")?.querySelector("ion-item");

  if (!(scrollView instanceof HTMLElement) || !(item instanceof HTMLElement))
    return;

  const itemOffsetTop = getOffsetTop(item, scrollView);

  if (itemOffsetTop > scrollView.scrollTop) return;

  scrollIntoView(item);
}
