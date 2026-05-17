import { RecipeDetails } from "@/components/recipe-details";

type RecipeDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RecipeDetailsPage({ params }: RecipeDetailsPageProps) {
  const { id } = await params;

  return <RecipeDetails recipeId={id} />;
}
