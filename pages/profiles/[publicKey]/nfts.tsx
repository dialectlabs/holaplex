import { ProfileContainer } from '@/common/components/elements/ProfileContainer';
import { showFirstAndLastFour } from '@/modules/utils/string';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { FC, useState } from 'react';
//@ts-ignore
import FeatherIcon from 'feather-icons-react';
import cx from 'classnames';
import { SingleGrid } from '@/common/components/icons/SingleGrid';
import { DoubleGrid } from '@/common/components/icons/DoubleGrid';
import { TripleGrid } from '@/common/components/icons/TripleGrid';
import { OwnedNfTsQuery, useOwnedNfTsQuery } from '../../../src/graphql/indexerTypes';
import Link from 'next/link';
import TextInput2 from '@/common/components/elements/TextInput2';
import {
  getPropsForWalletOrUsername,
  WalletDependantPageProps,
} from '@/modules/server-side/getProfile';
import { ProfileDataProvider } from '@/common/context/ProfileData';
import { imgOpt } from '../../../src/common/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  HOLAPLEX_MARKETPLACE_ADDRESS,
  HOLAPLEX_MARKETPLACE_SUBDOMAIN,
} from '@/common/constants/marketplace';
import Button from '@/components/elements/Button';
import { DisplaySOL } from '@/components/CurrencyHelpers';
import Modal from '@/components/elements/Modal';
import SellForm from '../../../src/common/components/forms/SellForm';
import { Listing, Marketplace, Nft, Offer } from '@holaplex/marketplace-js-sdk';
import { ApolloQueryResult, OperationVariables } from '@apollo/client';
import { None } from '@/components/forms/OfferForm';
import UpdateSellForm from '@/components/forms/UpdateSellForm';
import BuyForm from '@/components/forms/BuyForm';
import UpdateOfferForm from '../../../src/common/components/forms/UpdateOfferForm';
import { Avatar } from '@/common/components/elements/Avatar';
import { InView } from 'react-intersection-observer';
import { isEmpty } from 'ramda';

type OwnedNFT = OwnedNfTsQuery['nfts'][0];

export const getServerSideProps: GetServerSideProps<WalletDependantPageProps> = async (context) =>
  getPropsForWalletOrUsername(context);

export const LoadingNFTCard = () => {
  return (
    <div
      className={`overflow-hidden, animate-pulse rounded-lg border-gray-900 bg-gray-900 p-4 shadow-2xl shadow-black`}
    >
      <div className={`aspect-square w-full rounded-lg bg-gray-800`} />
      <div className={`flex h-24 items-center py-6 px-4`}>
        <div className={`h-5 w-36 animate-pulse rounded-md bg-gray-700`} />
      </div>
      <div className={`h-20 md:h-36 xl:h-20`}>
        <div
          className={`flex h-full w-full items-center justify-between p-4 md:flex-col md:items-start md:justify-between xl:flex-row xl:items-center xl:justify-between`}
        >
          <div className={`h-5 w-16 animate-pulse rounded-md bg-gray-700`} />

          <div className={`h-10 w-36 animate-pulse rounded-full bg-gray-700`} />
        </div>
      </div>
    </div>
  );
};

export const NFTCard = ({
  nft,
  marketplace,
  refetch,
  loading = false,
}: {
  nft: OwnedNFT;
  marketplace: Marketplace;
  refetch: (
    variables?: Partial<OperationVariables> | undefined
  ) => Promise<ApolloQueryResult<None>>;
  loading: boolean;
}) => {
  const { publicKey } = useWallet();
  const creatorsCopy = [...nft.creators];
  const sortedCreators = creatorsCopy.sort((a, b) => b.share - a.share);
  const shownCreatorAddress = sortedCreators.length > 0 ? sortedCreators[0].address : null;

  const offers = nft?.offers;
  const topOffers = offers?.sort((a, b) => Number(a.price) - Number(b.price));
  const topOffer = topOffers?.[0];
  const addedOffer = nft?.offers.find((offer) => offer.buyer === publicKey?.toBase58());
  const hasAddedOffer = Boolean(addedOffer);
  const isOwner = Boolean(nft?.owner?.address === publicKey?.toBase58());
  const defaultListing = nft?.listings.find(
    (listing) => listing.auctionHouse.toString() === HOLAPLEX_MARKETPLACE_ADDRESS
  );
  const hasDefaultListing = Boolean(defaultListing);
  const lastSale = nft?.purchases?.[0]?.price;

  const [listNFTVisibility, setListNFTVisibility] = useState(false);
  const [updateListingVisibility, setUpdateListingVisibility] = useState(false);
  const [updateOfferVisibility, setUpdateOfferVisibility] = useState(false);

  return (
    <>
      <div className="transform overflow-hidden rounded-lg border-gray-900 bg-gray-900 p-4 shadow-2xl shadow-black transition duration-[300ms] hover:scale-[1.02]">
        <Link href={`/nfts/${nft.address}`} scroll={true} passHref>
          <div className={`cursor-pointer`}>
            <div className={`relative `}>
              <img
                src={imgOpt(nft.image, 600)}
                alt={nft.name}
                className="aspect-square w-full rounded-lg object-cover"
              />
              {shownCreatorAddress && (
                <div className={`absolute left-0 top-0 flex flex-row items-center p-4`}>
                  <Link href={`/profiles/${shownCreatorAddress}`}>
                    <a className="text-gray-300">
                      <Avatar address={shownCreatorAddress} showAddress={false} border={true} />
                    </a>
                  </Link>

                  {offers.length > 0 && (
                    <div
                      className={`ml-2 flex h-6 items-center rounded-full bg-gray-900 bg-opacity-60 px-2 font-mono text-sm`}
                      style={{ backdropFilter: `blur(10px)` }}
                    >
                      {offers.length} OFFER{offers.length > 1 && `S`}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex h-24 items-center bg-gray-900 py-6 px-4">
              <p className="w-max-fit m-0 mb-0 min-h-[28px] truncate text-lg font-bold">
                {nft.name}
              </p>
            </div>
          </div>
        </Link>
        <div className={`h-20 md:h-36 xl:h-20`}>
          <div
            className={`flex h-full w-full items-center justify-between p-4 md:flex-col md:items-start md:justify-between xl:flex-row xl:items-center xl:justify-between`}
          >
            {hasDefaultListing && (
              <ul className={`mb-0 flex flex-col`}>
                <li className={`text-sm font-bold text-gray-300`}>Price</li>
                <DisplaySOL amount={Number(defaultListing?.price)} />
              </ul>
            )}
            {!hasDefaultListing && !hasAddedOffer && Boolean(lastSale) && (
              <ul className={`mb-0 flex flex-col`}>
                <li className={`text-sm font-bold text-gray-300`}>Last sale</li>
                <DisplaySOL amount={Number(lastSale)} />
              </ul>
            )}
            {!hasDefaultListing && !hasAddedOffer && !Boolean(lastSale) && (
              <ul className={`mb-0 flex flex-col`}>
                <li className={`text-sm font-bold text-gray-300`}>Not listed</li>
              </ul>
            )}
            {!hasDefaultListing && hasAddedOffer && (
              <ul className={`mb-0 flex flex-col`}>
                <li className={`text-sm font-bold text-gray-300`}>Your offer</li>
                <DisplaySOL amount={Number(addedOffer?.price) || 0} />
              </ul>
            )}

            {isOwner && !hasDefaultListing && (
              <div className={`md:mt-4 md:w-full xl:mt-0 xl:w-32`}>
                <Button className={`md:w-full xl:w-32`} onClick={() => setListNFTVisibility(true)}>
                  List NFT
                </Button>
              </div>
            )}
            {isOwner && hasDefaultListing && (
              <div className={`md:mt-4 md:w-full xl:mt-0 xl:w-32`}>
                <Button
                  className={`md:w-full xl:w-32`}
                  onClick={() => setUpdateListingVisibility(true)}
                >
                  Update
                </Button>
              </div>
            )}
            {!isOwner && !hasAddedOffer && hasDefaultListing && (
              <div className={`md:mt-4 md:w-full xl:mt-0 xl:w-auto`}>
                <BuyForm
                  nft={nft as Nft | any}
                  marketplace={marketplace}
                  listing={defaultListing as Listing}
                  refetch={refetch}
                  className={`w-32 md:w-full xl:w-32`}
                />
              </div>
            )}
            {!isOwner && hasAddedOffer && (
              <div className={`md:mt-4 md:w-full xl:mt-0 xl:w-32`}>
                <Button
                  secondary
                  className={`bg-gray-800 md:w-full xl:w-32`}
                  onClick={() => setUpdateOfferVisibility(true)}
                >
                  Update
                </Button>
              </div>
            )}
            {!isOwner && !hasAddedOffer && !hasDefaultListing && (
              <div className={`md:mt-4 md:w-full xl:mt-0 xl:w-32`}>
                <Link href={`/nfts/${nft?.address}/offers/new`}>
                  <a>
                    <Button className={`md:w-full xl:w-32`}>Make offer</Button>
                  </a>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal open={listNFTVisibility} setOpen={setListNFTVisibility} title={`List NFT for sale`}>
        <SellForm
          setOpen={setListNFTVisibility}
          nft={nft as Nft | any}
          refetch={refetch}
          loading={loading}
          marketplace={marketplace}
        />
      </Modal>
      <Modal
        open={updateListingVisibility}
        setOpen={setUpdateListingVisibility}
        title={`Update listing price`}
      >
        <UpdateSellForm
          nft={nft as Nft | any}
          refetch={refetch}
          marketplace={marketplace as Marketplace}
          listing={defaultListing as Listing}
          setOpen={setUpdateListingVisibility}
          offer={topOffer as Offer}
        />
      </Modal>
      <Modal open={updateOfferVisibility} setOpen={setUpdateOfferVisibility} title={`Update offer`}>
        <UpdateOfferForm
          nft={nft as Nft | any}
          refetch={refetch}
          marketplace={marketplace as Marketplace}
          listing={defaultListing as Listing}
          setOpen={setUpdateOfferVisibility}
          loading={loading}
          hasListing={hasDefaultListing}
        />
      </Modal>
    </>
  );
};

interface NFTGridProps {
  nfts: OwnedNFT[];
  marketplace: Marketplace;
  gridView: '1x1' | '2x2' | '3x3';
  refetch: (
    variables?: Partial<OperationVariables> | undefined
  ) => Promise<ApolloQueryResult<None>>;
  onLoadMore: (inView: boolean, entry: IntersectionObserverEntry) => Promise<void>;
  hasMore: boolean;
  loading?: boolean;
}

export const NFTGrid: FC<NFTGridProps> = ({
  nfts,
  marketplace,
  gridView,
  refetch,
  onLoadMore,
  hasMore,
  loading = false,
}) => {
  return (
    <div
      className={cx(
        'grid grid-cols-1 gap-6',
        gridView === '1x1'
          ? 'grid-cols-1 md:grid-cols-2'
          : gridView === '2x2'
          ? 'sm:grid-cols-2'
          : 'md:grid-cols-3'
      )}
    >
      {loading ? (
        <>
          <LoadingNFTCard />
          <LoadingNFTCard />
          <LoadingNFTCard />
        </>
      ) : (
        <>
          {nfts.map((nft) => (
            <NFTCard
              key={nft.address}
              nft={nft}
              refetch={refetch}
              loading={loading}
              marketplace={marketplace}
            />
          ))}
          {hasMore && (
            <div>
              <InView threshold={0.1} onChange={onLoadMore}>
                <LoadingNFTCard />
              </InView>
            </div>
          )}
        </>
      )}
    </div>
  );
};

type ListedFilterState = 'all' | 'listed' | 'unlisted' | 'search';

const ProfileNFTs: NextPage<WalletDependantPageProps> = (props) => {
  const { publicKey: pk } = props;
  // const [listedFilter, setListedFilter] = useState<ListedFilterState>('search');
  // const [showSearchField, toggleSearchField] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [gridView, setGridView] = useState<'1x1' | '2x2' | '3x3'>('3x3');
  const [hasMore, setHasMore] = useState(true);
  const variables = {
    subdomain: HOLAPLEX_MARKETPLACE_SUBDOMAIN,
    address: pk,
    limit: 100,
    offset: 0,
  };
  const ownedNFTs = useOwnedNfTsQuery({
    variables: variables,
  });
  const refetch = ownedNFTs.refetch;
  const loading = ownedNFTs.loading;
  const fetchMore = ownedNFTs.fetchMore;
  const actualOwnedNFTs = ownedNFTs?.data?.nfts || [];

  const nfts = actualOwnedNFTs.filter((item) => item?.owner?.address === pk);
  const marketplace = ownedNFTs?.data?.marketplace;

  const [query, setQuery] = useState('');

  const nftsToShow =
    query === ''
      ? nfts
      : nfts.filter((nft) => nft.name.toLowerCase().includes(query.toLowerCase()));

  const GridSelector = () => {
    return (
      <div className="ml-4  hidden divide-gray-800 rounded-lg border-2 border-solid border-gray-800 sm:flex">
        <button
          className={cx(
            'flex w-10 items-center justify-center border-r-2 border-gray-800 md:hidden',
            {
              'bg-gray-800': gridView === '1x1',
            }
          )}
          onClick={() => setGridView('1x1')}
        >
          <SingleGrid
            className={gridView !== '1x1' ? 'transition hover:scale-110 ' : ''}
            color={gridView === '1x1' ? 'white' : '#707070'}
          />
        </button>

        <button
          className={cx('flex w-10 items-center justify-center', {
            'bg-gray-800': gridView === '2x2',
          })}
          onClick={() => setGridView('2x2')}
        >
          <DoubleGrid
            className={gridView !== '2x2' ? 'transition hover:scale-110 ' : ''}
            color={gridView === '2x2' ? 'white' : '#707070'}
          />
        </button>

        <button
          className={cx(
            'hidden w-10 items-center justify-center border-l-2 border-gray-800 md:flex',
            {
              'bg-gray-800': gridView === '3x3',
            }
          )}
          onClick={() => setGridView('3x3')}
        >
          <TripleGrid
            className={gridView !== '3x3' ? 'transition hover:scale-110' : ''}
            color={gridView === '3x3' ? 'white' : '#707070'}
          />
        </button>
      </div>
    );
  };

  return (
    <ProfileDataProvider profileData={props}>
      <Head>
        <title>{showFirstAndLastFour(pk)}&apos;s NFTs | Holaplex</title>
        <meta property="description" key="description" content="View owned and created NFTs" />
      </Head>
      <ProfileContainer>
        <div className="mb-4 flex">
          <TextInput2
            id="owned-search"
            label="owned search"
            hideLabel
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leadingIcon={
              <FeatherIcon
                icon="search"
                aria-hidden="true"
                className={searchFocused ? 'text-white' : 'text-gray-500'}
              />
            }
            placeholder="Search"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <GridSelector />
        </div>
        <NFTGrid
          hasMore={hasMore}
          onLoadMore={async (inView) => {
            if (!inView || loading) {
              return;
            }

            const { data: newData } = await fetchMore({
              variables: {
                ...variables,
                offset: nftsToShow.length + 100,
              },
              updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) return prev;
                const prevNfts = prev.nfts;
                const moreNfts = fetchMoreResult.nfts;
                if (isEmpty(moreNfts)) {
                  setHasMore(false);
                }

                fetchMoreResult.nfts = [...prevNfts, ...moreNfts];

                return { ...fetchMoreResult };
              },
            });
          }}
          nfts={nftsToShow}
          gridView={gridView}
          refetch={refetch}
          loading={ownedNFTs.loading}
          marketplace={marketplace as Marketplace}
        />
      </ProfileContainer>
    </ProfileDataProvider>
  );
};

export default ProfileNFTs;
