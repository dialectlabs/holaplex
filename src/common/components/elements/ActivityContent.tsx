import { FC, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { AnchorButton } from '@/components/elements/Button';
import { Col, Row } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { useActivityPageQuery } from 'src/graphql/indexerTypes';
import { DateTime } from 'luxon';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useTwitterHandle } from '@/common/hooks/useTwitterHandle';
import { showFirstAndLastFour } from '@/modules/utils/string';
import { mq } from '@/common/styles/MediaQuery';
import { imgOpt, RUST_ISO_UTC_DATE_FORMAT } from '@/common/utils';
import { ChevronRight } from '../icons/ChevronRight';
import { Unpacked } from '@/types/Unpacked';
import Bugsnag from '@bugsnag/js';
import TextInput2 from './TextInput2';
// @ts-ignore
import FeatherIcon from 'feather-icons-react';
import { IFeedItem } from '@/modules/feed/feed.interfaces';
import { ActivityCard } from './ActivityCard';
import { useProfileData } from '@/common/context/ProfileData';
import { LoadingBox, LoadingLine } from './LoadingPlaceholders';

export const ActivityContent = () => {
  const { publicKey: pk } = useProfileData();
  const publicKey = new PublicKey(pk);
  const [activityFilter, setActivityFilter] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const activityPage = useActivityPageQuery({
    variables: {
      address: publicKey.toBase58(),
    },
  });

  const isLoading = activityPage.loading;

  const activityItems = useMemo(
    () =>
      activityPage.data?.wallet?.bids.reduce((items, bid) => {
        const listing = bid.listing;
        const storefront = bid.listing?.storefront;
        if (!listing || !storefront) return items;

        const nft = bid.listing?.nfts[0];

        const listingEnded = listing.ended;
        const hasHighestBid = listing.bids[0].bidderAddress === bid.bidderAddress;

        const itemBase: Partial<IFeedItem> = {
          id: bid.bidderAddress + bid.listingAddress,
          sourceUser: {
            pubkey: bid.bidderAddress,
            // handle // fetch async?
          },
          nft: nft && {
            address: nft.address,
            imageURL: nft.image,
            storeSubdomain: storefront.subdomain,
            name: nft.name,
            listingAddress: listing.address,
            // creator
          },
          misc: {
            bidCancelled: bid.cancelled,
            wonListing: listingEnded && hasHighestBid,
          },
          listing: {
            address: listing.address,
            ended: listing.ended,
          },
          storefront,
        };

        if (listingEnded) {
          const activityType = hasHighestBid ? 'LISTING_WON' : 'LISTING_LOST';
          items.push({
            ...itemBase,
            id: itemBase.id + activityType,
            type: activityType,
            timestamp: listing.bids[0].lastBidTime, // more or less
            toUser:
              activityType === 'LISTING_LOST'
                ? {
                    pubkey: listing.bids[0].bidderAddress,
                  }
                : undefined,
            solAmount: listing.bids[0].lastBidAmount,
          });
        }

        if (listing.bids.length > 1) {
          const fromBidIdx = listing.bids.findIndex((b) => b.bidderAddress === bid.bidderAddress);
          const activityType =
            listing.bids[0].bidderAddress === bid.bidderAddress ? 'OUTBID' : 'WAS_OUTBID';
          const toIdx = activityType === 'OUTBID' ? fromBidIdx + 1 : fromBidIdx - 1;
          items.push({
            ...itemBase,
            id: itemBase.id + activityType,
            type: activityType,
            timestamp: listing.bids[0].lastBidTime, // more or less
            toUser: {
              pubkey: listing.bids[toIdx].bidderAddress,
            },
            solAmount: listing.bids[activityType === 'OUTBID' ? fromBidIdx : toIdx].lastBidAmount,
          });
        }

        items.push({
          ...itemBase,
          id: itemBase.id + 'BID_MADE',
          solAmount: bid.lastBidAmount,
          type: 'BID_MADE',
          timestamp: bid.lastBidTime,
        });

        return items;
      }, [] as IFeedItem[]) || [],
    [activityPage.data?.wallet?.bids]
  );

  const filteredActivityItems = activityItems.filter((i) => {
    return (
      !activityFilter ||
      [i.nft?.name, i.storefront?.title, i.storefront?.subdomain].some((w) =>
        w?.toLocaleLowerCase()?.includes(activityFilter.toLocaleLowerCase())
      )
    );
  });

  return (
    <ActivityContainer>
      <div className="mb-4  ">
        <TextInput2
          id="activity-search"
          label="activity search"
          hideLabel
          value={activityFilter}
          onChange={(e) => setActivityFilter(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          leadingIcon={
            <FeatherIcon
              icon="search"
              aria-hidden="true"
              className={searchFocused ? 'text-white' : 'text-gray-500'}
            />
          }
          placeholder="Search"
        />
      </div>
      {/* <div className="flex">
          <button className="mr-2 bg-gray-600 p-2 hover:bg-gray-800">Bids</button>
          <button className="mr-2 bg-gray-600 p-2 hover:bg-gray-800">Unclaimed bids</button>
          <button className="mr-2 bg-gray-600 p-2 hover:bg-gray-800">Wins</button>
          <button className="mr-2 bg-gray-600 p-2 hover:bg-gray-800">Losses</button>
        </div> */}

      <div className="space-y-4">
        {isLoading ? (
          <>
            <LoadingActivitySkeletonBoxCircleLong />
            <LoadingActivitySkeletonBoxSquareShort />
            <LoadingActivitySkeletonBoxCircleLong />
            <LoadingActivitySkeletonBoxSquareShort />
            <LoadingActivitySkeletonBoxCircleLong />
            <LoadingActivitySkeletonBoxSquareShort />
            <LoadingActivitySkeletonBoxCircleLong />
            <LoadingActivitySkeletonBoxSquareShort />
            <LoadingActivitySkeletonBoxCircleLong />
          </>
        ) : filteredActivityItems.length ? (
          filteredActivityItems.map((item) => <ActivityCard activity={item} key={item.id} />)
        ) : (
          <div className="mt-12 flex flex-col rounded-lg border border-gray-800 p-4 text-center">
            <span className="text-center text-2xl font-semibold">
              No activity
              {!!activityItems.length && !filteredActivityItems.length && ' for this filter'}
            </span>
            <span className="mt-2 text-gray-300 ">
              Activity associated with this user’s wallet will show up here
            </span>
          </div>
        )}
      </div>
    </ActivityContainer>
  );
};

const LoadingActivitySkeletonBoxSquareShort = () => {
  return (
    <ActivityBoxContainer>
      <CenteredCol>
        <LoadingBox $borderRadius="8px" />
      </CenteredCol>
      <ContentContainer>
        <LoadingLinesContainer>
          <LoadingLine $width="60%" />
          <LoadingLine $width="25%" $height="16px" />
        </LoadingLinesContainer>
      </ContentContainer>
    </ActivityBoxContainer>
  );
};

const LoadingActivitySkeletonBoxCircleLong = () => {
  return (
    <ActivityBoxContainer>
      <CenteredCol>
        <LoadingBox $borderRadius="8px" />
      </CenteredCol>
      <ContentContainer>
        <LoadingLinesContainer>
          <LoadingLine $width="100%" />
          <LoadingLine $width="25%" $height="16px" />
        </LoadingLinesContainer>
      </ContentContainer>
    </ActivityBoxContainer>
  );
};

const LoadingLinesContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const NoActivityTitle = styled.span`
  font-family: 'Inter', sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 24px;
  line-height: 32px;
  text-align: center;
`;

const NoActivityText = styled.span`
  font-family: 'Inter', sans-serif;
  font-style: normal;
  font-weight: normal;
  font-size: 16px;
  line-height: 24px;
  color: #a8a8a8;
  margin-top: 8px;
  text-align: center;
`;

const ActivityContainer = styled.main`
  flex: 1;
  margin-top: 16px;
  /*
  ${mq('lg')} {
    margin-top: 0px;
    margin-left: 40px;
  }
  ${mq('xl')} {
    margin-left: 80px;
  }*/
`;

const ContentContainer = styled.div`
  flex: 1;
  margin-left: 16px;
  margin-right: 16px;
  align-items: center;
`;

const CenteredCol = styled(Col)`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ActivityBoxContainer = styled.div`
  display: flex;
  flex: 1;
  padding: 16px;
  border: 1px solid #262626;
  box-sizing: border-box;
  border-radius: 8px;
`;

const NFTImage = styled(Image)<{ $isPFPImage: boolean }>`
  object-fit: contain;
  ${({ $isPFPImage }) =>
    $isPFPImage
      ? css`
          border-radius: 50%;
        `
      : css`
          border-radius: 2px;
        `}
`;
