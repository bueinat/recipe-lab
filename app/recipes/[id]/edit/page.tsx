import { EditRecipePage } from "@/components/edit-recipe-page";

type EditRecipeRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditRecipeRoute({ params }: EditRecipeRouteProps) {
  const { id } = await params;

  return <EditRecipePage recipeId={id} />;
}
