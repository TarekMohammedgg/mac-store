import {
  AccessoryGridSkeleton,
  FiltersSkeleton,
  PageHeaderSkeleton,
} from '@/components/shared/skeletons';

export default function AccessoriesLoading() {
  return (
    <div className="container-narrow py-10 sm:py-14">
      <PageHeaderSkeleton />
      <FiltersSkeleton />
      <AccessoryGridSkeleton count={8} />
    </div>
  );
}
