import {
  FiltersSkeleton,
  PageHeaderSkeleton,
  ProductGridSkeleton,
} from '@/components/shared/skeletons';

export default function ProductsLoading() {
  return (
    <div className="container-narrow py-10 sm:py-14">
      <PageHeaderSkeleton />
      <FiltersSkeleton />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
